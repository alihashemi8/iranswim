"""
Centralized Geographic Configuration & Boundaries — Qazvin City Only
=====================================================================
Mandatory geographic restriction enforcing search boundaries strictly within
Qazvin city, Qazvin Province, Iran (قزوین).
"""

import math
from typing import Dict, List, Optional, Tuple, Any

# ==============================================================================
# 1. QAZVIN CITY GEOGRAPHIC DEFINITIONS
# ==============================================================================

CITY_NAME_FA = "قزوین"
PROVINCE_NAME_FA = "استان قزوین"
COUNTRY_CODE = "IR"

# Authoritative centroid of Qazvin city (Sabzeh Meydan / Azadi Square area)
QAZVIN_CENTER = {
    "lat": 36.2797,
    "lng": 50.0049,
    "name": "میدان آزادی قزوین (سبزه‌میدان)",
}

# Strict Axis-Aligned Bounding Box (AABB) for initial rapid spatial filtering
# Any point outside this box is immediately rejected before polygon checking.
QAZVIN_BOUNDS = {
    "min_lat": 36.2350,
    "max_lat": 36.3400,
    "min_lng": 49.9600,
    "max_lng": 50.0750,
}

# Accurate boundary polygon enclosing the urban perimeter of Qazvin City
# Ordered vertices (lng, lat) representing the municipal boundary:
# Clockwise from North-West (Molla Sadra / University North) down to Railway Station:
QAZVIN_CITY_POLYGON: List[Tuple[float, float]] = [
    (49.9700, 36.3100),  # NW: North of Molla Sadra / University Campus
    (49.9850, 36.3350),  # North: Barajin / Islamic Azad University Entrance
    (50.0400, 36.3350),  # NE: Barajin Highway / Kowsar North
    (50.0650, 36.3150),  # E-NE: Pounak / Kowsar East / Freeway bypass
    (50.0700, 36.2900),  # East: Minoodar East / Shahid Sayyad Shirazi
    (50.0600, 36.2650),  # SE: Minoodar South / Tehran Old Gate
    (50.0350, 36.2420),  # S-SE: Southern Ring Road / Shahid Beheshti
    (49.9950, 36.2400),  # South: Railway Station (Rah Ahan)
    (49.9700, 36.2550),  # S-SW: South-Western Ring Road
    (49.9600, 36.2800),  # West: Hakimieh / Western Ring Bypass
    (49.9650, 36.3000),  # W-NW: Mollasadra West
]

# Max radius in kilometers from Qazvin center for conservative proximity checks
MAX_CITY_RADIUS_KM = 8.5

# ==============================================================================
# 2. OUTSIDE CITIES & PROVINCES REJECTION LIST
# ==============================================================================

# Explicit list of other major Iranian cities, provinces, and provincial towns
# outside Qazvin city boundary that should trigger an "outside scope" notification.
OUTSIDE_LOCATIONS: Dict[str, str] = {
    # Provincial towns outside Qazvin city limits
    "الوند": "الوند (خارج از محدوده شهر قزوین)",
    "محمدیه": "محمدیه (خارج از محدوده شهر قزوین)",
    "زیباشهر": "زیباشهر / محمدیه (خارج از محدوده شهر قزوین)",
    "مهرگان": "شهرک مهرگان (خارج از محدوده شهر قزوین)",
    "تاکستان": "تاکستان (شهرستان تاکستان)",
    "آبیک": "آبیک (شهرستان آبیک)",
    "اقبالیه": "اقبالیه (خارج از محدوده شهر قزوین)",
    "محمودآباد نمونه": "محمودآباد نمونه (خارج از محدوده شهر قزوین)",
    "بویین زهرا": "بوئین‌زهرا (شهرستان بوئین‌زهرا)",
    "بوئین زهرا": "بوئین‌زهرا (شهرستان بوئین‌زهرا)",
    "آوج": "آوج (شهرستان آوج)",
    "شریفیه": "شریفیه / شریف‌آباد (خارج از محدوده شهر قزوین)",
    "بیدستان": "بیدستان (خارج از محدوده شهر قزوین)",
    "اسماعیل آباد": "اسماعیل‌آباد",

    # Major Metropolises & Other Cities
    "تهران": "تهران",
    "کرج": "کرج (استان البرز)",
    "فردیس": "فردیس (استان البرز)",
    "هشتگرد": "هشتگرد (استان البرز)",
    "اصفهان": "اصفهان",
    "مشهد": "مشهد",
    "شیراز": "شیراز",
    "تبریز": "تبریز",
    "اهواز": "اهواز",
    "قم": "قم",
    "رشت": "رشت",
    "کرمانشاه": "کرمانشاه",
    "ارومیه": "ارومیه",
    "یزد": "یزد",
    "کرمان": "کرمان",
    "همدان": "همدان",
    "اراک": "اراک",
    "ساری": "ساری",
    "گرگان": "گرگان",
    "زنجان": "زنجان",
    "سنندج": "سنندج",
    "خرم آباد": "خرم‌آباد",
    "بندرعباس": "بندرعباس",
    "بوشهر": "بوشهر",
    "سمنان": "سمنان",
    "زاهدان": "زاهدان",
    "بجنورد": "بجنورد",
    "بیرجند": "بیرجند",
    "اردبیل": "اردبیل",
    "ایلام": "ایلام",
    "شهرکرد": "شهرکرد",
    "یاسوج": "یاسوج",
    "کاشان": "کاشان",
    "کیش": "جزیره کیش",
    "قشم": "جزیره قشم",
}

OUTSIDE_SCOPE_MESSAGE = (
    "سامانه جستجوی ایران‌شنا منحصراً برای محدوده «شهر قزوین» پیکربندی شده است. "
    "امکان جستجوی آدرس یا اماکن خارج از محدوده شهری قزوین وجود ندارد."
)


# ==============================================================================
# 3. GEOSPATIAL VALIDATION ALGORITHMS
# ==============================================================================

def is_in_qazvin_bounds(lat: float, lng: float) -> bool:
    """Rapid spatial screening using axis-aligned bounding box."""
    if lat is None or lng is None:
        return False
    return (
        QAZVIN_BOUNDS["min_lat"] <= lat <= QAZVIN_BOUNDS["max_lat"]
        and QAZVIN_BOUNDS["min_lng"] <= lng <= QAZVIN_BOUNDS["max_lng"]
    )


def point_in_polygon(lng: float, lat: float, polygon: List[Tuple[float, float]]) -> bool:
    """
    Standard Ray-Casting algorithm for 2D Point-in-Polygon containment test.
    Determines whether point (lng, lat) is strictly inside polygon.
    """
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if lat > min(p1y, p2y):
            if lat <= max(p1y, p2y):
                if lng <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lng <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def is_point_in_qazvin(lat: Optional[float], lng: Optional[float]) -> bool:
    """
    Authoritative backend geospatial validator:
    Confirms coordinate is strictly inside Qazvin city boundaries.
    Uses AABB short-circuit followed by full ray-casting polygon test.
    """
    if lat is None or lng is None:
        return False
    try:
        lat_f = float(lat)
        lng_f = float(lng)
    except (ValueError, TypeError):
        return False

    if not is_in_qazvin_bounds(lat_f, lng_f):
        return False

    return point_in_polygon(lng_f, lat_f, QAZVIN_CITY_POLYGON)


def detect_outside_scope_intent(normalized_query: str) -> Optional[Dict[str, Any]]:
    """
    Analyzes normalized user query to determine if they are explicitly
    searching for a location, town, or city outside Qazvin city.
    """
    if not normalized_query:
        return None

    # Check for direct outside location matches
    tokens = set(normalized_query.split())
    for outside_key, outside_label in OUTSIDE_LOCATIONS.items():
        # Match if key is present as a whole token or exact phrase
        if outside_key in normalized_query:
            # Confirm it's not a street named after the city (e.g. "خیابان تهران قدیم" is a real Qazvin street)
            if outside_key == "تهران" and ("تهران قدیم" in normalized_query or "دروازه تهران" in normalized_query):
                continue
            if outside_key == "تبریز" and ("تبریز قدیم" in normalized_query or "دروازه تبریز" in normalized_query):
                continue
            return {
                "is_outside_scope": True,
                "detected_location": outside_label,
                "message": OUTSIDE_SCOPE_MESSAGE,
            }

    return None


def calculate_distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculates great-circle distance between two points in meters using Haversine formula.
    """
    if None in (lat1, lng1, lat2, lng2):
        return 0.0

    r = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def format_distance_persian(meters: float) -> str:
    """
    Formats distance in meters into human-readable Persian string.
    e.g. 450 -> '۴۵۰ متر', 1850 -> '۱.۹ کیلومتر'
    """
    persian_digits = str.maketrans("0123456789.", "۰۱۲۳۴۵۶۷۸۹٫")
    if meters < 1000:
        rounded = int(round(meters / 10.0) * 10)
        return f"{rounded} متر".translate(persian_digits)
    km = meters / 1000.0
    if km < 10:
        return f"{km:.1f} کیلومتر".translate(persian_digits)
    return f"{int(round(km))} کیلومتر".translate(persian_digits)
