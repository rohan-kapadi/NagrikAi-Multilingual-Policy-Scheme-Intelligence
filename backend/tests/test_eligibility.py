import pytest
from backend.app.models import Scheme, Criterion, CitizenProfile
from backend.app.pipeline.eligibility import evaluate_condition, evaluate_eligibility
from backend.app.data_loader import get_scheme_by_id


def test_operators():
    # eq
    assert evaluate_condition("farmer", "eq", "farmer") is True
    assert evaluate_condition("Farmer", "eq", "farmer") is True
    assert evaluate_condition("student", "eq", "farmer") is False
    assert evaluate_condition(100, "eq", 100) is True

    # ne
    assert evaluate_condition("student", "ne", "farmer") is True
    assert evaluate_condition("farmer", "ne", "farmer") is False

    # lt
    assert evaluate_condition(15, "lt", 18) is True
    assert evaluate_condition(18, "lt", 18) is False

    # lte
    assert evaluate_condition(18, "lte", 18) is True
    assert evaluate_condition(200000, "lte", 250000) is True
    assert evaluate_condition(300000, "lte", 250000) is False

    # gt
    assert evaluate_condition(1.2, "gt", 0) is True
    assert evaluate_condition(0, "gt", 0) is False

    # gte
    assert evaluate_condition(60, "gte", 60) is True
    assert evaluate_condition(59, "gte", 60) is False

    # in
    assert evaluate_condition("graduate", "in", ["class_12", "graduate", "postgraduate"]) is True
    assert evaluate_condition("Class_12", "in", ["class_12", "graduate"]) is True
    assert evaluate_condition("class_8", "in", ["class_12", "graduate"]) is False

    # not_in
    assert evaluate_condition("general", "not_in", ["sc", "st"]) is True
    assert evaluate_condition("sc", "not_in", ["sc", "st"]) is False

    # between
    assert evaluate_condition(25, "between", [18, 35]) is True
    assert evaluate_condition(18, "between", [18, 35]) is True
    assert evaluate_condition(40, "between", [18, 35]) is False

    # is_true / is_false
    assert evaluate_condition(True, "is_true", None) is True
    assert evaluate_condition(False, "is_true", None) is False
    assert evaluate_condition(False, "is_false", None) is True
    assert evaluate_condition(True, "is_false", None) is False


def test_missing_fields_and_need_more_info():
    scheme = Scheme(
        id="test-scheme",
        name={"en": "Test Scheme", "hi": "टेस्ट", "mr": "टेस्ट"},
        level="central",
        category=["welfare"],
        criteria=[
            Criterion(
                id="c1",
                label={"en": "Age > 18", "hi": "आयु > 18", "mr": "वय > 18"},
                field="age",
                op="gte",
                value=18
            ),
            Criterion(
                id="c2",
                label={"en": "Income <= 200000", "hi": "आय", "mr": "उत्पन्न"},
                field="annual_family_income",
                op="lte",
                value=200000
            )
        ],
        official_url="https://example.gov.in"
    )

    # Profile with age present but income missing
    profile = CitizenProfile(age=25, annual_family_income=None)
    result = evaluate_eligibility(scheme, profile)

    assert result.overall == "need_more_info"
    assert "annual_family_income" in result.missing_fields
    assert len(result.criteria_results) == 2
    assert result.criteria_results[0].status == "met"
    assert result.criteria_results[1].status == "missing"


def test_exclusion_rule():
    scheme = Scheme(
        id="test-scheme-exclusion",
        name={"en": "Exclusion Scheme", "hi": "टेस्ट", "mr": "टेस्ट"},
        level="central",
        category=["welfare"],
        criteria=[
            Criterion(
                id="c1",
                label={"en": "Occupation farmer", "hi": "किसान", "mr": "शेतकरी"},
                field="occupation",
                op="eq",
                value="farmer"
            )
        ],
        exclusions=[
            Criterion(
                id="e1",
                label={"en": "Income > 10000000", "hi": "अति अमीर", "mr": "अति श्रीमंत"},
                field="annual_family_income",
                op="gt",
                value=10000000
            )
        ],
        official_url="https://example.gov.in"
    )

    # Profile matches criteria BUT matches exclusion
    profile = CitizenProfile(occupation="farmer", annual_family_income=15000000)
    result = evaluate_eligibility(scheme, profile)

    assert result.overall == "not_eligible"
    assert any("[Exclusion]" in r.label for r in result.criteria_results)


def test_pm_kisan_placeholder_scenarios():
    pm_kisan = get_scheme_by_id("pm-kisan")
    assert pm_kisan is not None

    # Case 1: Clearly eligible farmer
    p_eligible = CitizenProfile(
        occupation="farmer",
        land_holding_hectares=1.5,
        annual_family_income=250000,
        language="hi"
    )
    res_eligible = evaluate_eligibility(pm_kisan, p_eligible, language="hi")
    assert res_eligible.overall == "eligible"
    assert all(r.status == "met" for r in res_eligible.criteria_results)
    assert len(res_eligible.missing_fields) == 0

    # Case 2: Ineligible (no land)
    p_ineligible = CitizenProfile(
        occupation="farmer",
        land_holding_hectares=0,
        annual_family_income=250000
    )
    res_ineligible = evaluate_eligibility(pm_kisan, p_ineligible)
    assert res_ineligible.overall == "not_eligible"
    assert any(r.status == "not_met" for r in res_ineligible.criteria_results)

    # Case 3: Missing info (land holding unknown)
    p_missing = CitizenProfile(
        occupation="farmer",
        land_holding_hectares=None
    )
    res_missing = evaluate_eligibility(pm_kisan, p_missing)
    assert res_missing.overall == "need_more_info"
    assert "land_holding_hectares" in res_missing.missing_fields


def test_scholarship_placeholder_scenarios():
    scholarship = get_scheme_by_id("post-matric-scholarship")
    assert scholarship is not None

    # Case 1: Eligible student
    p_eligible = CitizenProfile(
        occupation="student",
        annual_family_income=180000,
        education_level="graduate",
        language="mr"
    )
    res_eligible = evaluate_eligibility(scholarship, p_eligible, language="mr")
    assert res_eligible.overall == "eligible"

    # Case 2: Ineligible due to family income above ceiling
    p_high_income = CitizenProfile(
        occupation="student",
        annual_family_income=350000,
        education_level="graduate"
    )
    res_high_income = evaluate_eligibility(scholarship, p_high_income)
    assert res_high_income.overall == "not_eligible"
