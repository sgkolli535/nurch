"""
Validates diagnosis output against species DB ground truth.

This eval catches cases where the AI contradicts known species data — for example,
recommending "more sun" for a shade-loving plant, or identifying a pest that doesn't
affect the species. These are the most dangerous failures because they erode user trust.
"""
from app.models.diagnosis import Diagnosis
from app.models.eval_result import EvalResult
from app.models.species import Species


async def evaluate_diagnosis(diagnosis: Diagnosis, species: Species | None) -> EvalResult:
    """
    Cross-reference AI diagnosis against species known data.

    Checks:
    1. Sun recommendation vs species sun_requirement
    2. Water recommendation vs species water_needs
    3. Pest identification vs species common_pests
    4. Disease identification vs species common_diseases
    5. Frost advice vs species frost_tolerance
    """
    flags = []
    score = 1.0
    checks_run = 0

    if not species or not diagnosis.raw_response:
        return EvalResult(
            diagnosis_id=diagnosis.id,
            eval_type="diagnosis_accuracy",
            passed=True,
            score=1.0,
            details={"flags": [], "checks_run": 0, "note": "No species data to validate against"},
            prompt_version_used=diagnosis.prompt_version_used,
            model_used=diagnosis.model_used,
        )

    categories = diagnosis.raw_response.get("categories", {})

    # 1. Check hydration recommendation vs species water needs
    hydration = categories.get("hydration", {})
    if hydration.get("status") and hydration.get("severity", "none") != "none":
        checks_run += 1
        if hydration["status"] == "under_watered" and species.water_needs == "low":
            flags.append("water_mismatch: AI says under-watered but species has low water needs")
            score -= 0.2
        elif hydration["status"] == "over_watered" and species.water_needs == "high":
            flags.append("water_mismatch: AI says over-watered but species has high water needs")
            score -= 0.2

    # 2. Check environmental stress vs species requirements
    env = categories.get("environmental_stress", {})
    if env.get("stressor") and env.get("severity", "none") != "none":
        checks_run += 1
        stressor = str(env["stressor"]).lower()
        if "light" in stressor or "sun" in stressor:
            if "insufficient" in stressor and species.sun_requirement in ("shade", "partial_shade"):
                flags.append(f"sun_mismatch: AI says insufficient light but species needs {species.sun_requirement}")
                score -= 0.3
            elif "too much" in stressor and species.sun_requirement == "full_sun":
                flags.append("sun_mismatch: AI says too much light but species needs full sun")
                score -= 0.3

    # 3. Check pest identification against known pests
    pest = categories.get("pests", {})
    if pest.get("identified") and species.common_pests:
        checks_run += 1
        pest_name = pest["identified"].lower().replace(" ", "_")
        known_pests = [p.lower().replace(" ", "_") for p in species.common_pests]
        if pest_name not in known_pests and pest.get("confidence", 0) > 0.7:
            flags.append(f"unknown_pest: '{pest['identified']}' not in species known pests (confidence {pest.get('confidence')})")
            score -= 0.15

    # 4. Check disease identification
    disease = categories.get("disease", {})
    if disease.get("identified") and species.common_diseases:
        checks_run += 1
        disease_name = disease["identified"].lower().replace(" ", "_")
        known_diseases = [d.lower().replace(" ", "_") for d in species.common_diseases]
        if disease_name not in known_diseases and disease.get("confidence", 0) > 0.7:
            flags.append(f"unknown_disease: '{disease['identified']}' not in species known diseases (confidence {disease.get('confidence')})")
            score -= 0.15

    # 5. Check frost advice vs tolerance
    raw_text = str(diagnosis.raw_response).lower()
    if "protect from frost" in raw_text and species.frost_tolerant:
        checks_run += 1
        flags.append("frost_mismatch: AI says protect from frost but species is frost tolerant")
        score -= 0.1

    passed = score >= 0.6 and len(flags) == 0

    return EvalResult(
        diagnosis_id=diagnosis.id,
        eval_type="diagnosis_accuracy",
        passed=passed,
        score=max(0, round(score, 3)),
        details={"flags": flags, "checks_run": checks_run},
        prompt_version_used=diagnosis.prompt_version_used,
        model_used=diagnosis.model_used,
    )
