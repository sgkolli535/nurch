"""
Post-processing guardrails for AI outputs.
Validates responses against species data, checks for dangerous recommendations,
and applies confidence-based fallbacks.

Used as a node in the LangGraph agent graph and as post-processing for diagnoses.
"""
import re

from app.models.species import Species


DANGEROUS_RECOMMENDATION_PATTERNS = [
    r"apply\s+(?:bleach|ammonia|gasoline|motor\s*oil)",
    r"(?:neonicotinoid|chlorpyrifos|paraquat)\s+(?:spray|application|treatment)",
    r"(?:safe\s+to\s+eat|edible)\s+.*(?:oleander|foxglove|nightshade|castor)",
    r"spray\s+(?:with\s+)?(?:roundup|glyphosate)\s+(?:on|near)\s+(?:edible|vegetable|herb|fruit)",
]

FALLBACK_RESPONSES = {
    "low_confidence": (
        "\n\n---\n"
        "**Note:** I'm not fully confident in this assessment. Here are some options:\n"
        "- Take another photo from a different angle, ideally in natural daylight\n"
        "- Your local Cooperative Extension office offers free plant diagnostics\n"
        "- Try the UC IPM online diagnostic tool at ipm.ucanr.edu\n"
        "(Source: COOP_EXT)"
    ),
    "safety_flag": (
        "I want to make sure I give you safe advice, so I'd rather err on the side "
        "of caution here. For this specific issue, I'd recommend consulting your local "
        "Cooperative Extension office — they can do a hands-on assessment and recommend "
        "treatments appropriate for your area and situation. You can find your local office "
        "at https://nifa.usda.gov/land-grant-colleges-and-universities-702 (Source: COOP_EXT)"
    ),
}


def validate_response_against_species(response_text: str, species: Species | None) -> list[str]:
    """Check response for contradictions with species data."""
    flags = []
    if not species:
        return flags

    text = response_text.lower()

    # Sun recommendation vs species requirement
    if species.sun_requirement == "shade" and any(p in text for p in ["more sun", "full sun", "direct sunlight"]):
        flags.append(f"sun_contradiction: recommending more sun for {species.common_name} which needs shade")
    if species.sun_requirement == "full_sun" and any(p in text for p in ["less sun", "move to shade", "indirect light"]):
        flags.append(f"sun_contradiction: recommending less sun for {species.common_name} which needs full sun")

    # Water recommendation vs species needs
    if species.water_needs == "low" and any(p in text for p in ["water more", "water daily", "keep moist"]):
        flags.append(f"water_contradiction: recommending frequent watering for {species.common_name} (low water needs)")
    if species.water_needs == "high" and any(p in text for p in ["let dry out", "reduce watering", "water less"]):
        flags.append(f"water_contradiction: recommending less water for {species.common_name} (high water needs)")

    # Frost advice vs species tolerance
    if species.frost_tolerant and "protect from frost" in text:
        flags.append(f"frost_contradiction: {species.common_name} is frost tolerant")

    return flags


def check_safety(text: str) -> list[str]:
    """Scan for dangerous recommendation patterns."""
    flags = []
    for pattern in DANGEROUS_RECOMMENDATION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            flags.append(f"safety_pattern: {pattern}")
    return flags


def apply_confidence_fallback(confidence_level: str, response: str) -> str:
    """If confidence is low, append helpful fallback guidance."""
    if confidence_level == "low":
        return response + FALLBACK_RESPONSES["low_confidence"]
    return response


def run_guardrails(response_text: str, confidence_level: str, species: Species | None = None) -> tuple[str, list[str]]:
    """
    Full guardrails pipeline. Returns (possibly_modified_response, flags).

    Used in:
    - LangGraph agent graph (guardrails_check node)
    - Post-diagnosis validation
    """
    all_flags = []

    # Safety check
    safety_flags = check_safety(response_text)
    all_flags.extend(safety_flags)

    if safety_flags:
        return FALLBACK_RESPONSES["safety_flag"], all_flags

    # Species validation
    species_flags = validate_response_against_species(response_text, species)
    all_flags.extend(species_flags)

    # Confidence fallback
    response_text = apply_confidence_fallback(confidence_level, response_text)

    return response_text, all_flags
