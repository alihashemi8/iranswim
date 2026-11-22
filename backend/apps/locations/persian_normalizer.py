"""
Centralized Persian Normalization & NLP Engine
=============================================
High-performance text normalization, Arabic/Persian character normalization,
written number-word conversion, diacritics stripping, ZWNJ management,
typo tolerance (Damerau-Levenshtein), and contextual intent extraction.
"""

import re
from typing import Dict, List, Optional, Set, Tuple, Any

# ==============================================================================
# 1. CHARACTER & NUMERAL MAPPINGS
# ==============================================================================

DIGITS_MAP = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}

DIGITS_EN_TO_FA = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')

ARABIC_TO_PERSIAN = {
    'ي': 'ی',
    'ك': 'ک',
    'ة': 'ه',
    'ۀ': 'ه',
    'ؤ': 'و',
    'إ': 'ا',
    'أ': 'ا',
    'آ': 'ا',
    'ئ': 'ی',
    'ء': '',
}

DIACRITICS_REGEX = re.compile(r'[\u064B-\u065F\u0670]')  # Fathatan, Dammatan, etc.
PUNCTUATION_REGEX = re.compile(r'[,،\-_.\\()[\]+!؟?«»"\'#@/:;~*|]+')
WHITESPACE_REGEX = re.compile(r'\s+')

# Persian number words mapping
PERSIAN_NUMBER_MAP: Dict[str, int] = {
    'یک': 1, 'اول': 1, 'یکم': 1, 'نخست': 1,
    'دو': 2, 'دوم': 2,
    'سه': 3, 'سوم': 3,
    'چهار': 4, 'چهارم': 4,
    'پنج': 5, 'پنجم': 5,
    'شش': 6, 'ششم': 6,
    'هفت': 7, 'هفتم': 7,
    'هشت': 8, 'هشتم': 8,
    'نه': 9, 'نهم': 9,
    'ده': 10, 'دهم': 10,
    'یازده': 11, 'یازدهم': 11,
    'دوازده': 12, 'دوازدهم': 12,
    'سیزده': 13, 'سیزدهم': 13,
    'چهارده': 14, 'چهاردهم': 14,
    'پانزده': 15, 'پانزدهم': 15,
    'شانزده': 16, 'شانزدهم': 16,
    'هفده': 17, 'هفدهم': 17,
    'هجده': 18, 'هجدهم': 18,
    'نوزده': 19, 'نوزدهم': 19,
    'بیست': 20, 'بیستم': 20,
    'سی': 30, 'سی‌ام': 30, 'سی ام': 30,
    'چهل': 40, 'چهلم': 40,
    'پنجاه': 50, 'پنجاهم': 50,
    'شصت': 60, 'شصتم': 60,
    'هفتاد': 70, 'هفتادم': 70,
    'هشتاد': 80, 'هشتادم': 80,
    'نود': 90, 'نودم': 90,
    'صد': 100, 'صدم': 100,
}

STEM_SYNONYMS: Dict[str, List[str]] = {
    'نوروزی': ['نوروزیان', 'نوروز'],
    'نوروزیان': ['نوروزی', 'نوروز'],
    'ولیعصر': ['ولی عصر', 'عصر'],
    'ولی عصر': ['ولیعصر'],
    'شریعتی': ['دکتر شریعتی', 'کوروش'],
    'مطهری': ['شهید مطهری'],
    'بهشتی': ['شهید بهشتی'],
    'بابایی': ['شهید بابایی'],
    'رجایی': ['شهید رجایی'],
    'غیاث اباد': ['غیاث‌آباد', 'غیاث آباد'],
    'غیاث آباد': ['غیاث‌آباد', 'غیاث اباد'],
    'سبزه میدان': ['میدان آزادی', 'میدان ازادی', 'سبزه‌میدان'],
    'میدان ازادی': ['سبزه میدان', 'میدان آزادی'],
    'میدان آزادی': ['سبزه میدان', 'میدان ازادی'],
}

CATEGORY_INTENT_MAP = {
    'استخر': 'pool',
    'شنا': 'pool',
    'ورزشگاه': 'pool',
    'مجموعه ورزشی': 'pool',
    'بیمارستان': 'hospital',
    'درمانگاه': 'hospital',
    'کلینیک': 'hospital',
    'داروخانه': 'pharmacy',
    'دارو': 'pharmacy',
    'پمپ بنزین': 'gas_station',
    'بنزین': 'gas_station',
    'جایگاه سوخت': 'gas_station',
    'گاز': 'gas_station',
    'رستوران': 'restaurant',
    'غذا': 'restaurant',
    'کافه': 'cafe',
    'کافی شاپ': 'cafe',
    'قهوه': 'cafe',
    'بانک': 'bank',
    'خودپرداز': 'bank',
    'عابربانک': 'bank',
    'دانشگاه': 'university',
    'دانشکده': 'university',
    'مدرسه': 'school',
    'پارک': 'park',
    'بوستان': 'park',
    'نانوایی': 'bakery',
    'نان': 'bakery',
    'پاساژ': 'commercial',
    'مجتمع تجاری': 'commercial',
    'بازار': 'commercial',
    'مرکز خرید': 'commercial',
    'تعمیرگاه': 'mechanic',
    'مکانیکی': 'mechanic',
    'هتل': 'hotel',
    'اقامتگاه': 'hotel',
}


# ==============================================================================
# 2. NORMALIZATION FUNCTIONS
# ==============================================================================

def normalize_persian(text: Optional[str]) -> str:
    """
    Normalizes Persian/Arabic text:
    - Normalizes Arabic letters (ي -> ی, ك -> ک, ة/ۀ -> ه, etc.)
    - Converts Persian & Arabic numerals to ASCII digits (0-9)
    - Strips Arabic diacritics / accents (Tashkeel)
    - Replaces ZWNJ (\u200c) with space
    - Strips extraneous punctuation
    - Collapses multiple whitespace
    """
    if not text:
        return ""

    s = str(text)

    # 1. Convert digits to standard ASCII 0-9
    for ar, en in DIGITS_MAP.items():
        s = s.replace(ar, en)

    # 2. Convert Arabic characters to Persian standard
    for ar, fa in ARABIC_TO_PERSIAN.items():
        s = s.replace(ar, fa)

    # 3. Strip diacritics
    s = DIACRITICS_REGEX.sub('', s)

    # 4. Handle ZWNJ (Zero-Width Non-Joiner)
    s = s.replace('\u200c', ' ')

    # 5. Remove punctuation symbols
    s = PUNCTUATION_REGEX.sub(' ', s)

    # 6. Normalize whitespace and lower
    s = WHITESPACE_REGEX.sub(' ', s).strip().lower()
    return s


def tokenize_persian(text: Optional[str]) -> List[str]:
    """Tokenizes normalized Persian text into distinct non-empty words."""
    norm = normalize_persian(text)
    if not norm:
        return []
    return [t for t in norm.split() if len(t) > 0]


def parse_persian_word_number(word: Optional[str]) -> Optional[int]:
    """
    Parses a single or compound Persian written number word into an integer.
    e.g. 'چهل' -> 40, 'دوازده' -> 12, 'بیست و سه' -> 23
    """
    if not word:
        return None
    s = word.strip()
    if s in PERSIAN_NUMBER_MAP:
        return PERSIAN_NUMBER_MAP[s]

    # Check compound numbers connected by 'و' (e.g. "چهل و سه", "چهل و دوم")
    parts = re.split(r'\s+و\s+', s)
    if len(parts) == 2:
        t = PERSIAN_NUMBER_MAP.get(parts[0])
        o = PERSIAN_NUMBER_MAP.get(parts[1])
        if t is not None and o is not None:
            return t + o

    # Check if purely digits
    if s.isdigit():
        return int(s)

    return None


def convert_number_words_to_digits(query: Optional[str]) -> str:
    """
    Scans a query and converts written Persian number words into standard digits.
    e.g. 'حکمت چهل و دوم' -> 'حکمت 42'
    e.g. 'کوچه پانزدهم' -> 'کوچه 15'
    """
    if not query:
        return ""

    tokens = query.strip().split()
    i = 0
    while i < len(tokens):
        # Compound check: token[i] + 'و' + token[i+2]
        if i + 2 < len(tokens) and tokens[i + 1] == 'و':
            candidate = f"{tokens[i]} و {tokens[i + 2]}"
            num = parse_persian_word_number(candidate)
            if num is not None:
                tokens[i:i + 3] = [str(num)]
                continue

        # Single word check
        single_num = parse_persian_word_number(tokens[i])
        if single_num is not None:
            tokens[i] = str(single_num)
        i += 1

    return " ".join(tokens)


def extract_number_from_query(query: Optional[str]) -> Optional[int]:
    """
    Extracts an embedded integer number from a query, whether written
    in words (e.g. 'سی و هشت', 'چهل', 'دوازدهم') or digits ('38', '۳۸').
    """
    if not query:
        return None
    norm = normalize_persian(query)
    with_digits = convert_number_words_to_digits(norm)
    match = re.search(r'\b(\d+)\b', with_digits)
    if match:
        return int(match.group(1))
    return parse_persian_word_number(norm)


# ==============================================================================
# 3. TYPO TOLERANCE: DAMERAU-LEVENSHTEIN DISTANCE
# ==============================================================================

def damerau_levenshtein_distance(s1: str, s2: str) -> int:
    """
    Calculates the Damerau-Levenshtein distance between two strings,
    allowing insertion, deletion, substitution, and transposition of two adjacent characters.
    """
    len1, len2 = len(s1), len(s2)
    d: Dict[Tuple[int, int], int] = {}

    for i in range(-1, len1 + 1):
        d[(i, -1)] = i + 1
    for j in range(-1, len2 + 1):
        d[(-1, j)] = j + 1

    for i in range(len1):
        for j in range(len2):
            cost = 0 if s1[i] == s2[j] else 1
            d[(i, j)] = min(
                d[(i - 1, j)] + 1,       # deletion
                d[(i, j - 1)] + 1,       # insertion
                d[(i - 1, j - 1)] + cost  # substitution
            )
            # Transposition check
            if i > 0 and j > 0 and s1[i] == s2[j - 1] and s1[i - 1] == s2[j]:
                d[(i, j)] = min(d[(i, j)], d[(i - 2, j - 2)] + 1)

    return d[(len1 - 1, len2 - 1)]


def is_fuzzy_match(word1: str, word2: str) -> Tuple[bool, int]:
    """
    Determines if word1 and word2 are a valid fuzzy match based on length-tuned threshold:
    - Length < 4: Exact match only (edit distance 0)
    - Length 4..6: Allows edit distance <= 1
    - Length >= 7: Allows edit distance <= 2
    Returns (is_match, edit_distance).
    """
    if word1 == word2:
        return True, 0

    min_len = min(len(word1), len(word2))
    if min_len < 4:
        return False, 99

    max_allowed = 1 if min_len <= 6 else 2
    dist = damerau_levenshtein_distance(word1, word2)
    return dist <= max_allowed, dist


# ==============================================================================
# 4. CONTEXT & INTENT EXTRACTION
# ==============================================================================

def extract_search_intent(query: str) -> Dict[str, Any]:
    """
    Extracts high-level search intent, target category, special flags,
    and landmark proximity cues from a Persian search query.
    e.g. «رستوران نزدیک من» -> {'category': 'restaurant', 'near_me': True}
    e.g. «داروخانه شبانه روزی» -> {'category': 'pharmacy', 'is_24h': True}
    e.g. «بانک نزدیک میدان آزادی» -> {'category': 'bank', 'anchor': 'میدان آزادی'}
    """
    norm = normalize_persian(query)
    intent: Dict[str, Any] = {
        'original_query': query,
        'normalized_query': norm,
        'category': None,
        'near_me': False,
        'is_24h': False,
        'anchor_landmark': None,
    }

    # Proximity intent ("نزدیک من", "اطراف من", "نزدیک اینجا")
    if any(phrase in norm for phrase in ['نزدیک من', 'اطراف من', 'نزدیک خودم', 'اطرافم', 'نزدیکم']):
        intent['near_me'] = True

    # 24 Hours / Night pharmacy intent
    if any(phrase in norm for phrase in ['شبانه روزی', 'شبانهروزی', '24 ساعته']):
        intent['is_24h'] = True

    # Category matching
    for phrase, cat in CATEGORY_INTENT_MAP.items():
        if phrase in norm:
            intent['category'] = cat
            break

    # Anchor landmark extraction ("نزدیک ...")
    anchor_match = re.search(r'نزدیک\s+([^\s]+(?:\s+[^\s]+){0,3})', norm)
    if anchor_match:
        candidate_anchor = anchor_match.group(1).replace('من', '').strip()
        if candidate_anchor and candidate_anchor not in ('اینجا', 'خودم'):
            intent['anchor_landmark'] = candidate_anchor

    return intent
