import pytest
from datetime import date
from backend.app.engine.fuzzy_matcher import match_names, normalize_indian_name

def test_exact_name_match():
    res = match_names("Aarav Sharma", "Aarav Sharma")
    assert res["is_acceptable"] is True
    assert res["score"] == 100.0
    assert res["requires_manual_resolution"] is False

def test_transliteration_tolerance_mohd_vs_mohammed():
    res = match_names("Mohammed Tariq Khan", "Mohd Tariq Khan")
    assert res["is_acceptable"] is True
    assert res["requires_manual_resolution"] is False

def test_transliteration_tolerance_pooja_vs_puja():
    res = match_names("Pooja Sundaram", "Puja Sundaram")
    assert res["is_acceptable"] is True

def test_genuine_name_mismatch():
    res = match_names("Sunita Roy", "Sneha Roy")
    assert res["is_acceptable"] is False
    assert res["requires_manual_resolution"] is True
    assert res["match_level"] == "MISMATCH"
