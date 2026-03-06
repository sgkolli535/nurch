from app.prompts.registry import get_active_prompt, get_code_prompt, register_prompt

# Import prompt modules to trigger registration
import app.prompts.diagnosis  # noqa: F401
import app.prompts.agent  # noqa: F401
