"""
Validates that recommended actions make sense for the species.

Catches contradictions like:
- "Fertilize with nitrogen" for a nitrogen-fixing legume
- "Water deeply every day" for a succulent
- "Move to full sun" for an indoor shade plant
"""
from app.models.diagnosis import Diagnosis
from app.models.eval_result import EvalResult
from app.models.species import Species


# Patterns that contradict specific species traits
CONTRADICTIONS = [
    {
        "action_pattern": "water daily",
        "species_field": "water_needs",
        "species_value": "low",
        "flag": "overwatering_recommendation: daily watering for low-water species",
    },
    {
        "action_pattern": "water deeply every day",
        "species_field": "water_needs",
        "species_value": "low",
        "flag": "overwatering_recommendation: deep daily watering for low-water species",
    },
    {
        "action_pattern": "full sun",
        "species_field": "sun_requirement",
        "species_value": "shade",
        "flag": "sun_contradiction: recommending full sun for shade species",
    },
    {
        "action_pattern": "move to shade",
        "species_field": "sun_requirement",
        "species_value": "full_sun",
        "flag": "sun_contradiction: recommending shade for full-sun species",
    },
]


async def evaluate_recommendations(diagnosis: Diagnosis, species: Species | None) -> EvalResult:
    """Validate recommended actions against species requirements."""
    flags = []
    score = 1.0

    if not species or not diagnosis.raw_response:
        return EvalResult(
            diagnosis_id=diagnosis.id,
            eval_type="recommendation_accuracy",
            passed=True,
            score=1.0,
            details={"flags": [], "note": "No species data to validate against"},
            prompt_version_used=diagnosis.prompt_version_used,
            model_used=diagnosis.model_used,
        )

    # Collect all action text from categories
    categories = diagnosis.raw_response.get("categories", {})
    all_actions = []
    for cat_name, cat_data in categories.items():
        if isinstance(cat_data, dict) and cat_data.get("action"):
            all_actions.append(cat_data["action"].lower())

    # Also check prediction preventive_actions
    predictions = diagnosis.raw_response.get("predictions", []) or []
    for pred in predictions:
        if isinstance(pred, dict) and pred.get("preventive_action"):
            all_actions.append(pred["preventive_action"].lower())

    action_text = " ".join(all_actions)

    for rule in CONTRADICTIONS:
        species_val = getattr(species, rule["species_field"], None)
        if species_val == rule["species_value"] and rule["action_pattern"] in action_text:
            flags.append(rule["flag"])
            score -= 0.25

    # Check temperature recommendations vs species tolerance
    if species.temp_min_f and "bring indoors" in action_text:
        # If species can tolerate cold and temp isn't actually dangerous, flag
        if species.frost_tolerant and species.temp_min_f <= 20:
            flags.append("unnecessary_indoor_recommendation: species tolerates cold well")
            score -= 0.1

    passed = len(flags) == 0
    return EvalResult(
        diagnosis_id=diagnosis.id,
        eval_type="recommendation_accuracy",
        passed=passed,
        score=max(0, round(score, 3)),
        details={"flags": flags, "actions_checked": len(all_actions)},
        prompt_version_used=diagnosis.prompt_version_used,
        model_used=diagnosis.model_used,
    )
