import pytest
from backend.app.models import CitizenProfile
from backend.app.pipeline.profile import (
    extract_profile,
    merge_profiles,
    compute_missing_fields_for_scheme,
    get_clarifying_question
)
from backend.app.data_loader import get_scheme_by_id


def test_done_when_farmer_example():
    """
    Done when criterion from phases.md Phase 3:
    the message "Main Pune ka kisan hoon, 1.2 hectare zameen hai" yields:
    occupation=farmer, district=Pune, land_holding_hectares=1.2, everything else null.
    """
    msg = "Main Pune ka kisan hoon, 1.2 hectare zameen hai"
    profile = extract_profile(msg)

    assert profile.occupation == "farmer"
    assert profile.district == "Pune"
    assert profile.land_holding_hectares == 1.2

    # STRICT: All other fields MUST stay None (no guessing/inventing data)
    assert profile.age is None
    assert profile.gender is None
    assert profile.residence is None
    assert profile.annual_family_income is None
    assert profile.caste_category is None
    assert profile.education_level is None
    assert profile.is_disabled is None
    assert profile.is_bpl is None


def test_marathi_farmer_extraction():
    msg = "मी पुण्याचा शेतकरी आहे, माझ्याकडे 1.2 हेक्टर जमीन आहे"
    profile = extract_profile(msg)

    assert profile.occupation == "farmer"
    assert profile.district == "Pune"
    assert profile.land_holding_hectares == 1.2
    assert profile.age is None
    assert profile.annual_family_income is None


def test_student_extraction():
    msg = "I am a college student from Nagpur, family income 200000"
    profile = extract_profile(msg)

    assert profile.occupation == "student"
    assert profile.district == "Nagpur"
    assert profile.annual_family_income == 200000
    assert profile.land_holding_hectares is None
    assert profile.age is None


def test_merge_profiles():
    base = CitizenProfile(
        occupation="farmer",
        district="Pune",
        land_holding_hectares=1.2
    )

    # Next turn user provides income and age
    update = CitizenProfile(
        annual_family_income=180000,
        age=35
    )

    merged = merge_profiles(base, update)

    # Base attributes retained
    assert merged.occupation == "farmer"
    assert merged.district == "Pune"
    assert merged.land_holding_hectares == 1.2

    # New attributes merged
    assert merged.annual_family_income == 180000
    assert merged.age == 35

    # Still unknown attributes stay None
    assert merged.gender is None
    assert merged.caste_category is None


def test_compute_missing_fields():
    pm_kisan = get_scheme_by_id("pm-kisan")
    assert pm_kisan is not None

    # Profile with occupation but missing land holding
    partial_profile = CitizenProfile(occupation="farmer")
    missing = compute_missing_fields_for_scheme(pm_kisan, partial_profile)

    assert "land_holding_hectares" in missing
    assert "occupation" not in missing

    # Clarifying question generated in Hindi
    question_hi = get_clarifying_question("land_holding_hectares", language="hi")
    assert "कृषि भूमि" in question_hi or "हेक्टेयर" in question_hi
