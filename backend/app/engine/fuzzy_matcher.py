import re
from rapidfuzz import fuzz

COMMON_TRANSLITERATIONS = [
    (r"\bmohd\b", "mohammed"),
    (r"\bmd\b", "mohammed"),
    (r"\bmohammad\b", "mohammed"),
    (r"\bmuhammed\b", "mohammed"),
    (r"\bshri\b", "sri"),
    (r"\bchoudhary\b", "chaudhary"),
    (r"\bchoudhury\b", "chaudhary"),
    (r"\bdey\b", "de"),
    (r"\bvishwakarma\b", "biswakarma"),
    (r"\bvikash\b", "vikas"),
    (r"\bdeepak\b", "dipak"),
    (r"\bdeeksha\b", "diksha"),
    (r"\bpooja\b", "puja"),
    (r"\baarti\b", "arti"),
    (r"\bkumar\b", ""),
    (r"\bkumari\b", ""),
    (r"\bdevi\b", ""),
]

def normalize_indian_name(name: str) -> str:
    cleaned = re.sub(r"[^\w\s]", "", name.lower())
    for pattern, replacement in COMMON_TRANSLITERATIONS:
        cleaned = re.sub(pattern, replacement, cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def match_names(name_submitted: str, name_registry: str) -> dict:
    norm_sub = normalize_indian_name(name_submitted)
    norm_reg = normalize_indian_name(name_registry)
    
    if norm_sub == norm_reg:
        return {
            "score": 100.0,
            "match_level": "EXACT_OR_TRANSLITERATION_MATCH",
            "is_acceptable": True,
            "requires_manual_resolution": False,
            "notes": "Names match exactly under standard Indian phonological and transliteration rules."
        }
    
    token_score = fuzz.token_sort_ratio(name_submitted.lower(), name_registry.lower())
    norm_token_score = fuzz.token_sort_ratio(norm_sub, norm_reg)
    effective_score = max(token_score, norm_token_score)
    
    if effective_score >= 88.0:
        return {
            "score": float(effective_score),
            "match_level": "HIGH_CONFIDENCE_MATCH",
            "is_acceptable": True,
            "requires_manual_resolution": False,
            "notes": f"High confidence similarity match ({effective_score:.1f}%). Resolves minor typographical or transliteration variance."
        }
    elif effective_score >= 75.0:
        return {
            "score": float(effective_score),
            "match_level": "TRANSLITERATION_VARIANCE",
            "is_acceptable": False,
            "requires_manual_resolution": True,
            "notes": f"Phonetic/token similarity score is {effective_score:.1f}%. Sent to Manual Resolution Queue for Nodal Officer verification."
        }
    else:
        return {
            "score": float(effective_score),
            "match_level": "MISMATCH",
            "is_acceptable": False,
            "requires_manual_resolution": True,
            "notes": f"Significant mismatch ({effective_score:.1f}%). Submitted: '{name_submitted}' vs Registry: '{name_registry}'."
        }
