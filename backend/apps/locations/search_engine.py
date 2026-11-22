"""
Production-Grade Location Search & Autocomplete Engine — Qazvin Only
====================================================================
Implements weighted relevance ranking, multi-token Persian matching,
stem expansion, typo tolerance (Damerau-Levenshtein), contextual intent
resolution, user proximity scoring, and authoritative Qazvin city boundary enforcement.
"""

import logging
import urllib.request
import json
import hashlib
import re
from typing import Dict, List, Optional, Tuple, Any
from django.core.cache import cache

def remove_qazvin_prefix(text: str) -> str:
    """Removes 'قزوین' and 'استان قزوین' prefix/suffix for clean suggestions."""
    if not text:
        return ''
    cleaned = re.sub(r'(استان\s+)?(شهر\s+)?(شهرستان\s+)?قزوین\s*([،,]\s*)?', '', text)
    cleaned = re.sub(r'([،,]\s*)?(استان\s+)?(شهر\s+)?(شهرستان\s+)?قزوین', '', cleaned)
    return cleaned.strip(' ،,')

from apps.locations.geo_config import (
    QAZVIN_CENTER,
    QAZVIN_BOUNDS,
    is_point_in_qazvin,
    detect_outside_scope_intent,
    calculate_distance_meters,
    format_distance_persian,
)
from apps.locations.persian_normalizer import (
    normalize_persian,
    tokenize_persian,
    convert_number_words_to_digits,
    parse_persian_word_number,
    is_fuzzy_match,
    extract_search_intent,
    STEM_SYNONYMS,
)
from apps.locations.models import QazvinPlace, PlaceCategory

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 3600  # 1 hour query cache


# ==============================================================================
# 1. ICON & CATEGORY MAPPING
# ==============================================================================

CATEGORY_ICONS = {
    PlaceCategory.POOL: 'Waves',
    PlaceCategory.HEALTH: 'Activity',
    PlaceCategory.EDUCATION: 'GraduationCap',
    PlaceCategory.COMMERCIAL: 'ShoppingBag',
    PlaceCategory.SERVICE: 'Sparkles',
    PlaceCategory.TRANSPORT: 'Train',
    PlaceCategory.LANDMARK: 'Landmark',
    PlaceCategory.STREET: 'Compass',
    PlaceCategory.NEIGHBORHOOD: 'Building2',
    PlaceCategory.ALLEY: 'MapPin',
}

CATEGORY_LABELS = {
    PlaceCategory.POOL: 'استخر و اماکن ورزشی',
    PlaceCategory.HEALTH: 'مراکز درمانی و داروخانه',
    PlaceCategory.EDUCATION: 'دانشگاه و مراکز آموزشی',
    PlaceCategory.COMMERCIAL: 'مرکز خرید و بازار',
    PlaceCategory.SERVICE: 'خدمات شهری و رفاهی',
    PlaceCategory.TRANSPORT: 'حمل‌ونقل و پایانه‌ها',
    PlaceCategory.LANDMARK: 'اماکن شاخص و دیدنی',
    PlaceCategory.STREET: 'خیابان و معابر اصلی',
    PlaceCategory.NEIGHBORHOOD: 'محله‌های قزوین',
    PlaceCategory.ALLEY: 'کوچه و فرعی',
}


# ==============================================================================
# 2. RELEVANCE & RANKING ALGORITHM
# ==============================================================================

def score_place(
    place: QazvinPlace,
    raw_query: str,
    norm_query: str,
    query_tokens: List[str],
    query_digits: str,
    query_number: Optional[int],
    intent: Dict[str, Any],
    user_coords: Optional[Dict[str, float]],
) -> float:
    """
    Computes a weighted relevance score for a Qazvin place.
    Ranking Priority:
      1. Exact name match (+1000)
      2. Exact address match (+800)
      3. Name prefix match (+500)
      4. Highly relevant partial / multi-token match (+200..+400)
      5. Typo-tolerant match (+100 - edit_distance penalty)
      6. Category & contextual match (+350)
      7. Base importance / popularity (+0..+200)
      8. Proximity bonus (+0..+150)
    """
    norm_title = place.normalized_title
    norm_addr = place.normalized_address
    title_words = norm_title.split()

    score = 0.0
    matched_tokens_count = 0

    # 1. Exact Name / Address Match
    if norm_title == norm_query or norm_title == query_digits:
        score += 1000.0
    elif norm_title.startswith(norm_query) or norm_title.startswith(query_digits):
        score += 500.0
    elif norm_query in norm_title or query_digits in norm_title:
        score += 350.0

    if norm_addr == norm_query or norm_addr == query_digits:
        score += 800.0
    elif norm_query in norm_addr or query_digits in norm_addr:
        score += 250.0

    # 2. Token Matching & Fuzzy / Typo Tolerance
    for q_tok in query_tokens:
        tok_matched = False
        tok_score = 0.0

        # Exact word match in title
        if q_tok in title_words:
            tok_score = max(tok_score, 180.0)
            tok_matched = True
        else:
            # Word prefix match
            for tw in title_words:
                if tw.startswith(q_tok):
                    ratio = len(q_tok) / float(len(tw))
                    tok_score = max(tok_score, 120.0 + ratio * 50.0)
                    tok_matched = True
                    break

        # Neighborhood or street exact match
        if place.neighborhood and q_tok in normalize_persian(place.neighborhood):
            tok_score = max(tok_score, 150.0)
            tok_matched = True
        if place.street and q_tok in normalize_persian(place.street):
            tok_score = max(tok_score, 140.0)
            tok_matched = True

        # Stem / Synonym expansion match
        if not tok_matched and q_tok in STEM_SYNONYMS:
            for syn in STEM_SYNONYMS[q_tok]:
                syn_norm = normalize_persian(syn)
                if syn_norm in norm_title or syn_norm in norm_addr:
                    tok_score = max(tok_score, 140.0)
                    tok_matched = True
                    break

        # Keywords match
        if not tok_matched and place.keywords:
            for kw in place.keywords:
                kw_norm = normalize_persian(kw)
                if kw_norm == q_tok:
                    tok_score = max(tok_score, 130.0)
                    tok_matched = True
                    break
                elif q_tok in kw_norm:
                    tok_score = max(tok_score, 90.0)
                    tok_matched = True
                    break

        # Typo-tolerance check (Damerau-Levenshtein)
        if not tok_matched:
            for tw in title_words:
                is_match, dist = is_fuzzy_match(tw, q_tok)
                if is_match:
                    penalty = dist * 40.0
                    tok_score = max(tok_score, 100.0 - penalty)
                    tok_matched = True
                    break

        if tok_matched:
            matched_tokens_count += 1
            score += tok_score
        else:
            # Penalty for missing query token
            score -= 20.0

    # If multi-token query has zero matched tokens, skip unless category match
    if len(query_tokens) > 0 and matched_tokens_count == 0:
        if not intent.get('category') or intent.get('category') != place.place_type:
            return 0.0

    # 3. Number Agreement & Conflict Check
    # e.g., If query specifically asked for "حکمت 40", avoid matching "حکمت 41"
    if query_number is not None:
        place_num = parse_persian_word_number(place.alley) or parse_persian_word_number(place.title)
        if place_num is not None:
            if place_num == query_number:
                score += 200.0
            else:
                score -= 400.0  # Conflict penalty

    # 4. Context & Intent Match
    intent_cat = intent.get('category')
    if intent_cat:
        if place.place_type == intent_cat or place.category == intent_cat:
            score += 350.0

    # 24-hour intent
    if intent.get('is_24h'):
        if place.metadata.get('is_24h'):
            score += 250.0
        elif 'شبانه روزی' in place.title:
            score += 250.0

    # Anchor landmark proximity match (e.g. "نزدیک خیام", "نزدیک میدان آزادی")
    anchor = intent.get('anchor_landmark')
    if anchor:
        anchor_norm = normalize_persian(anchor)
        if anchor_norm in norm_addr or anchor_norm in norm_title or (place.neighborhood and anchor_norm in normalize_persian(place.neighborhood)):
            score += 250.0

    # 5. Base Importance & Popularity Bonus
    # Place importance ranges from 1 to 100
    score += (place.importance * 1.5)
    score += min(place.search_count * 2.0, 50.0)

    # 6. Proximity Bias (when valid user coordinates available inside Qazvin)
    if user_coords and user_coords.get('lat') and user_coords.get('lng'):
        try:
            u_lat = float(user_coords['lat'])
            u_lng = float(user_coords['lng'])
            if is_point_in_qazvin(u_lat, u_lng):
                dist_meters = calculate_distance_meters(u_lat, u_lng, place.latitude, place.longitude)
                dist_km = dist_meters / 1000.0
                # Proximity bonus decays smoothly over distance
                proximity_bonus = max(0.0, 150.0 - (dist_km * 25.0))
                score += proximity_bonus
        except (ValueError, TypeError):
            pass

    return max(0.0, score)


# ==============================================================================
# 3. EXTERNAL GEOCODER PROVIDER ABSTRACTION
# ==============================================================================

class BaseGeocodingProvider:
    """Pluggable base interface for geocoding fallback providers."""
    def geocode(self, query: str, bias_lat: float, bias_lng: float) -> List[Dict[str, Any]]:
        raise NotImplementedError


class PhotonGeocodingProvider(BaseGeocodingProvider):
    """
    Photon (OSM-based) geocoder integration with strict Qazvin bounding & polygon filtering.
    """
    def geocode(self, query: str, bias_lat: float, bias_lng: float) -> List[Dict[str, Any]]:
        clean_q = query.strip()
        if not clean_q:
            return []

        # Ensure search is centered on Qazvin
        search_query = clean_q if 'قزوین' in clean_q else f"قزوین {clean_q}"
        encoded = urllib.request.quote(search_query)
        url = (
            f"https://photon.komoot.io/api/?q={encoded}"
            f"&lat={bias_lat}&lon={bias_lng}&lang=default&limit=6"
        )

        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'IranSwim-Search-Engine/1.0 (+https://iranswim.ir)'}
        )

        results = []
        try:
            with urllib.request.urlopen(req, timeout=1.8) as response:
                if response.status == 200:
                    payload = json.loads(response.read().decode('utf-8'))
                    features = payload.get('features', [])
                    for feat in features:
                        coords = feat.get('geometry', {}).get('coordinates', [])
                        if len(coords) < 2:
                            continue
                        lng, lat = coords[0], coords[1]

                        # MANDATORY CRITICAL RESTRICTION: Reject any point outside Qazvin city!
                        if not is_point_in_qazvin(lat, lng):
                            continue

                        props = feat.get('properties', {})
                        name = props.get('name') or props.get('street') or ''
                        if not name:
                            continue

                        street = props.get('street', '')
                        neighborhood = props.get('locality') or props.get('district') or ''
                        osm_type = props.get('osm_value') or props.get('type') or 'place'

                        # Build standard hierarchy string
                        parts = ['استان قزوین', 'قزوین']
                        if neighborhood and neighborhood not in parts:
                            parts.append(neighborhood)
                        if street and street not in parts:
                            parts.append(f"خیابان {street}" if not street.startswith('خیابان') else street)
                        if name and name not in parts:
                            parts.append(name)

                        hierarchy = "، ".join(parts)

                        results.append({
                            'title': name,
                            'category': PlaceCategory.ALLEY if osm_type in ('residential', 'service', 'living_street') else PlaceCategory.LANDMARK,
                            'place_type': osm_type,
                            'address': hierarchy,
                            'neighborhood': neighborhood,
                            'street': street,
                            'latitude': lat,
                            'longitude': lng,
                            'importance': 40,
                            'source': 'osm',
                        })
        except Exception as e:
            logger.debug(f"External geocoder lookup skipped or timed out: {e}")

        return results


# ==============================================================================
# 4. SEARCH & AUTOCOMPLETE SERVICE
# ==============================================================================

class QazvinSearchEngine:
    def __init__(self):
        self.geocoder_provider = PhotonGeocodingProvider()

    @classmethod
    def get_all_places(cls) -> List[QazvinPlace]:
        """In-memory cached place list to achieve sub-millisecond autocomplete."""
        places = cache.get('all_qazvin_places_cache')
        if places is None:
            places = list(QazvinPlace.objects.filter(is_active=True).all())
            cache.set('all_qazvin_places_cache', places, 300)
        return places

    def search(
        self,
        query: str,
        user_coords: Optional[Dict[str, float]] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 15,
        enable_external: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes a production-grade location search strictly within Qazvin city.
        """
        raw_query = (query or '').strip()
        norm_query = normalize_persian(raw_query)

        # 1. Geographic restriction validation: Check for outside scope queries
        outside_scope = detect_outside_scope_intent(norm_query)
        if outside_scope:
            return {
                'is_outside_scope': True,
                'detected_location': outside_scope['detected_location'],
                'message': outside_scope['message'],
                'query': raw_query,
                'total_count': 0,
                'page': page,
                'page_size': page_size,
                'results': [],
                'categories': [],
            }

        if not raw_query or len(norm_query) < 2:
            return {
                'is_outside_scope': False,
                'query': raw_query,
                'total_count': 0,
                'page': page,
                'page_size': page_size,
                'results': [],
                'categories': [],
            }

        # Cache check
        user_grid = ""
        if user_coords and user_coords.get('lat') and user_coords.get('lng'):
            user_grid = f"_{round(float(user_coords['lat']), 2)}_{round(float(user_coords['lng']), 2)}"
        raw_key = f"qazvin_search_{norm_query}_{category or 'all'}_{page}_{page_size}{user_grid}"
        cache_key = f"qazvin_s_{hashlib.md5(raw_key.encode('utf-8')).hexdigest()}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        query_digits = convert_number_words_to_digits(norm_query)
        query_tokens = tokenize_persian(norm_query)
        query_number = parse_persian_word_number(norm_query) or parse_persian_word_number(query_digits)
        intent = extract_search_intent(raw_query)

        # 2. Candidate Filtering from Cached Places
        all_places = self.get_all_places()
        if category:
            all_places = [p for p in all_places if p.category == category]

        scored_items = []
        for place in all_places:
            # Enforce boundary check
            if not is_point_in_qazvin(place.latitude, place.longitude):
                continue

            score = score_place(
                place=place,
                raw_query=raw_query,
                norm_query=norm_query,
                query_tokens=query_tokens,
                query_digits=query_digits,
                query_number=query_number,
                intent=intent,
                user_coords=user_coords,
            )

            if score > 50.0:
                dist_m = None
                dist_fa = None
                if user_coords and user_coords.get('lat') and user_coords.get('lng'):
                    dist_m = calculate_distance_meters(
                        float(user_coords['lat']),
                        float(user_coords['lng']),
                        place.latitude,
                        place.longitude
                    )
                    dist_fa = format_distance_persian(dist_m)

                scored_items.append({
                    'id': place.id,
                    'title': place.title,
                    'category': place.category,
                    'category_label': place.get_category_display(),
                    'place_type': place.place_type,
                    'address': place.address,
                    'neighborhood': place.neighborhood,
                    'street': place.street,
                    'alley': place.alley,
                    'latitude': place.latitude,
                    'longitude': place.longitude,
                    'importance': place.importance,
                    'distance_meters': dist_m,
                    'distance_persian': dist_fa,
                    'icon': CATEGORY_ICONS.get(place.category, 'MapPin'),
                    'metadata': place.metadata,
                    'score': score,
                    'source': 'internal',
                })

        # 3. External Fallback if enabled and local matches are sparse
        if enable_external and len(scored_items) < 3 and len(query_tokens) > 0:
            bias_lat = QAZVIN_CENTER['lat']
            bias_lng = QAZVIN_CENTER['lng']
            if user_coords and user_coords.get('lat') and user_coords.get('lng'):
                bias_lat = float(user_coords['lat'])
                bias_lng = float(user_coords['lng'])

            ext_results = self.geocoder_provider.geocode(raw_query, bias_lat, bias_lng)
            for ext in ext_results:
                # Deduplicate against existing results
                is_dup = any(
                    calculate_distance_meters(ext['latitude'], ext['longitude'], existing['latitude'], existing['longitude']) < 50
                    for existing in scored_items
                )
                if not is_dup:
                    dist_m = None
                    dist_fa = None
                    if user_coords and user_coords.get('lat') and user_coords.get('lng'):
                        dist_m = calculate_distance_meters(
                            float(user_coords['lat']),
                            float(user_coords['lng']),
                            ext['latitude'],
                            ext['longitude']
                        )
                        dist_fa = format_distance_persian(dist_m)

                    scored_items.append({
                        'id': f"osm_{ext['latitude']}_{ext['longitude']}",
                        'title': ext['title'],
                        'category': ext['category'],
                        'category_label': CATEGORY_LABELS.get(ext['category'], 'اماکن قزوین'),
                        'place_type': ext['place_type'],
                        'address': ext['address'],
                        'neighborhood': ext['neighborhood'],
                        'street': ext['street'],
                        'alley': '',
                        'latitude': ext['latitude'],
                        'longitude': ext['longitude'],
                        'importance': ext['importance'],
                        'distance_meters': dist_m,
                        'distance_persian': dist_fa,
                        'icon': CATEGORY_ICONS.get(ext['category'], 'MapPin'),
                        'metadata': {},
                        'score': 150.0,
                        'source': 'osm',
                    })

        # 4. Sort by score descending
        scored_items.sort(key=lambda x: x['score'], reverse=True)

        # 5. Extract available category facets
        category_counts: Dict[str, int] = {}
        for item in scored_items:
            cat = item['category']
            category_counts[cat] = category_counts.get(cat, 0) + 1

        facets = [
            {'category': cat, 'label': CATEGORY_LABELS.get(cat, cat), 'count': count}
            for cat, count in category_counts.items()
        ]

        total_count = len(scored_items)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_results = scored_items[start_idx:end_idx]

        response_data = {
            'is_outside_scope': False,
            'query': raw_query,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'results': paged_results,
            'categories': facets,
        }

        cache.set(cache_key, response_data, CACHE_TTL_SECONDS)
        return response_data

    def autocomplete(
        self,
        query: str,
        user_coords: Optional[Dict[str, float]] = None,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """
        High-performance autocomplete endpoint for interactive typing.
        Provides categorized suggestions: popular, places, streets, neighborhoods,
        services, addresses, and query completions.
        """
        raw_query = (query or '').strip()
        norm_query = normalize_persian(raw_query)

        # Check outside scope
        outside = detect_outside_scope_intent(norm_query)
        if outside:
            return {
                'is_outside_scope': True,
                'detected_location': outside['detected_location'],
                'message': outside['message'],
                'suggestions': [],
                'categories': {},
            }

        # Cache check
        user_grid = ""
        if user_coords and user_coords.get('lat') and user_coords.get('lng'):
            user_grid = f"_{round(float(user_coords['lat']), 2)}_{round(float(user_coords['lng']), 2)}"
        raw_key = f"qazvin_ac_{norm_query}_{limit}{user_grid}"
        cache_key = f"qazvin_a_{hashlib.md5(raw_key.encode('utf-8')).hexdigest()}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # If empty query, return popular searches and high-importance landmarks in Qazvin
        if not norm_query:
            popular_places = sorted(self.get_all_places(), key=lambda p: (p.importance, p.search_count), reverse=True)[:limit]
            suggestions = []
            for p in popular_places:
                suggestions.append({
                    'id': p.id,
                    'title': p.title,
                    'subtitle': p.address,
                    'category': p.category,
                    'category_label': p.get_category_display(),
                    'latitude': p.latitude,
                    'longitude': p.longitude,
                    'icon': CATEGORY_ICONS.get(p.category, 'MapPin'),
                    'type': p.place_type,
                })
            return {
                'is_outside_scope': False,
                'query': '',
                'suggestions': suggestions,
                'categories': {'popular': suggestions},
            }

        # Run search (fast local query for interactive autocomplete)
        search_res = self.search(
            query=raw_query,
            user_coords=user_coords,
            page=1,
            page_size=limit,
            enable_external=False,
        )

        flat_suggestions = []
        categorized: Dict[str, List[Dict[str, Any]]] = {
            'places': [],
            'streets': [],
            'neighborhoods': [],
            'services': [],
            'addresses': [],
            'completions': [],
        }

        for item in search_res.get('results', []):
            suggestion = {
                'id': item['id'],
                'title': item['title'],
                'subtitle': item['address'],
                'category': item['category'],
                'category_label': item['category_label'],
                'neighborhood': item['neighborhood'],
                'latitude': item['latitude'],
                'longitude': item['longitude'],
                'distance_persian': item.get('distance_persian'),
                'icon': item['icon'],
                'type': item['place_type'],
            }
            flat_suggestions.append(suggestion)

            cat = item['category']
            if cat in (PlaceCategory.LANDMARK, PlaceCategory.EDUCATION):
                categorized['places'].append(suggestion)
            elif cat == PlaceCategory.STREET:
                categorized['streets'].append(suggestion)
            elif cat == PlaceCategory.NEIGHBORHOOD:
                categorized['neighborhoods'].append(suggestion)
            elif cat in (PlaceCategory.POOL, PlaceCategory.HEALTH, PlaceCategory.COMMERCIAL, PlaceCategory.SERVICE, PlaceCategory.TRANSPORT):
                categorized['services'].append(suggestion)
            elif cat == PlaceCategory.ALLEY:
                categorized['addresses'].append(suggestion)

        # Add smart query completions if query is prefix of common Qazvin searches
        completions = []
        popular_phrases = [
            'استخر شهید رجایی قزوین',
            'استخر المپیک قزوین',
            'میدان آزادی قزوین (سبزه‌میدان)',
            'خیابان خیام شمالی',
            'خیابان دانشگاه قزوین',
            'بلوار نوروزیان',
            'شهرک کوثر قزوین',
            'شهرک مینودر قزوین',
            'بیمارستان ولایت قزوین',
            'داروخانه شبانه‌روزی رازی',
            'پمپ بنزین بلوار شهید بابایی',
            'سرای سعدالسلطنه و بازار قزوین',
        ]
        for phrase in popular_phrases:
            phrase_norm = normalize_persian(phrase)
            if phrase_norm.startswith(norm_query) and phrase_norm != norm_query:
                completions.append({
                    'id': f"comp_{len(completions)}",
                    'title': phrase,
                    'subtitle': 'تکمیل جستجو در قزوین',
                    'category': 'completion',
                    'category_label': 'تکمیل عبارت',
                    'icon': 'Search',
                })
        categorized['completions'] = completions[:3]

        response_data = {
            'is_outside_scope': False,
            'query': raw_query,
            'suggestions': flat_suggestions[:limit],
            'categories': categorized,
        }

        cache.set(cache_key, response_data, CACHE_TTL_SECONDS)
        return response_data
