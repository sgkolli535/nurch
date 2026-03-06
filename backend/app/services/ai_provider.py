"""
AI Provider abstraction — swap between Gemini (free dev) and Claude (production)
via the AI_PROVIDER env var.
"""
import base64
import json
import time
from abc import ABC, abstractmethod

from app.config import settings


class AIProvider(ABC):
    @abstractmethod
    async def analyze_photo(
        self,
        photo_bytes: bytes,
        context_payload: dict,
        system_prompt: str,
        previous_photo_bytes: bytes | None = None,
    ) -> dict:
        """Analyze a plant photo and return structured diagnosis JSON."""
        ...

    @abstractmethod
    async def chat(
        self,
        messages: list[dict],
        system_prompt: str,
        tools: list[dict] | None = None,
    ) -> dict:
        """Chat completion for the agent."""
        ...


class GeminiProvider(AIProvider):
    """Google Gemini Flash — free tier for development."""

    async def analyze_photo(
        self,
        photo_bytes: bytes,
        context_payload: dict,
        system_prompt: str,
        previous_photo_bytes: bytes | None = None,
    ) -> dict:
        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)

        contents = []
        contents.append(genai.types.Part.from_bytes(data=photo_bytes, mime_type="image/jpeg"))
        contents.append(genai.types.Part.from_text(text="This is the current photo of the plant to diagnose."))

        if previous_photo_bytes:
            contents.append(genai.types.Part.from_bytes(data=previous_photo_bytes, mime_type="image/jpeg"))
            days = context_payload.get("history", {}).get("days_since_last_photo", "unknown")
            contents.append(genai.types.Part.from_text(text=f"This is the previous photo taken {days} days ago. Compare the two."))

        contents.append(genai.types.Part.from_text(
            text=f"Plant and environment context:\n{json.dumps(context_payload, indent=2, default=str)}"
        ))

        start = time.time()
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
            ),
        )
        elapsed_ms = int((time.time() - start) * 1000)

        result = json.loads(response.text)
        result["_processing_time_ms"] = elapsed_ms
        result["_model_used"] = "gemini-2.0-flash"
        return result

    async def chat(
        self,
        messages: list[dict],
        system_prompt: str,
        tools: list[dict] | None = None,
    ) -> dict:
        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)

        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(genai.types.Content(role=role, parts=[genai.types.Part.from_text(text=msg["content"])]))

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=genai.types.GenerateContentConfig(system_instruction=system_prompt),
        )
        return {"role": "assistant", "content": response.text}


class ClaudeProvider(AIProvider):
    """Anthropic Claude — production quality."""

    async def analyze_photo(
        self,
        photo_bytes: bytes,
        context_payload: dict,
        system_prompt: str,
        previous_photo_bytes: bytes | None = None,
    ) -> dict:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

        content = []
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": base64.b64encode(photo_bytes).decode()},
        })
        content.append({"type": "text", "text": "This is the current photo of the plant to diagnose."})

        if previous_photo_bytes:
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": base64.b64encode(previous_photo_bytes).decode()},
            })
            days = context_payload.get("history", {}).get("days_since_last_photo", "unknown")
            content.append({"type": "text", "text": f"This is the previous photo taken {days} days ago. Compare the two."})

        content.append({
            "type": "text",
            "text": f"Plant and environment context:\n{json.dumps(context_payload, indent=2, default=str)}",
        })

        # Route to appropriate model
        model = self._select_model(context_payload)

        start = time.time()
        response = await client.messages.create(
            model=model,
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": content}],
        )
        elapsed_ms = int((time.time() - start) * 1000)

        result = json.loads(response.content[0].text)
        result["_processing_time_ms"] = elapsed_ms
        result["_model_used"] = model
        return result

    async def chat(
        self,
        messages: list[dict],
        system_prompt: str,
        tools: list[dict] | None = None,
    ) -> dict:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

        kwargs = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1000,
            "system": system_prompt,
            "messages": messages,
        }
        if tools:
            kwargs["tools"] = tools

        response = await client.messages.create(**kwargs)
        return {"role": "assistant", "content": response.content[0].text}

    def _select_model(self, context_payload: dict) -> str:
        history = context_payload.get("history", {})
        prev_diagnoses = history.get("previous_diagnoses", [])
        active_issues = sum(1 for d in prev_diagnoses if d.get("overall_health") in ("warning", "critical"))

        if active_issues >= 3:
            return "claude-opus-4-20250514"
        if context_payload.get("species_profile") is None:
            return "claude-opus-4-20250514"
        return "claude-sonnet-4-20250514"


class OpenAIProvider(AIProvider):
    """OpenAI GPT-4o — good vision, widely available."""

    async def analyze_photo(
        self,
        photo_bytes: bytes,
        context_payload: dict,
        system_prompt: str,
        previous_photo_bytes: bytes | None = None,
    ) -> dict:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)

        content = []
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64.b64encode(photo_bytes).decode()}", "detail": "high"},
        })
        content.append({"type": "text", "text": "This is the current photo of the plant to diagnose."})

        if previous_photo_bytes:
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{base64.b64encode(previous_photo_bytes).decode()}", "detail": "high"},
            })
            days = context_payload.get("history", {}).get("days_since_last_photo", "unknown")
            content.append({"type": "text", "text": f"This is the previous photo taken {days} days ago. Compare the two."})

        content.append({
            "type": "text",
            "text": f"Plant and environment context:\n{json.dumps(context_payload, indent=2, default=str)}",
        })

        start = time.time()
        response = await client.chat.completions.create(
            model="gpt-4o",
            max_tokens=2000,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content},
            ],
        )
        elapsed_ms = int((time.time() - start) * 1000)

        result = json.loads(response.choices[0].message.content)
        result["_processing_time_ms"] = elapsed_ms
        result["_model_used"] = "gpt-4o"
        return result

    async def chat(
        self,
        messages: list[dict],
        system_prompt: str,
        tools: list[dict] | None = None,
    ) -> dict:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)

        oai_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            oai_messages.append({"role": msg["role"], "content": msg["content"]})

        response = await client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1000,
            messages=oai_messages,
        )
        return {"role": "assistant", "content": response.choices[0].message.content}


def get_ai_provider() -> AIProvider:
    if settings.ai_provider == "claude":
        return ClaudeProvider()
    if settings.ai_provider == "openai":
        return OpenAIProvider()
    return GeminiProvider()
