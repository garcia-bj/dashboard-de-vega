import time
import httpx
from app.config import get_settings
from app.utils.storage import get_storage, generate_image_path

settings = get_settings()


class GeminiService:
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    async def generate_image(self, prompt: str, publication_id: str) -> dict:
        start = time.perf_counter()

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{self.BASE_URL}/models/imagen-3.0-generate-001:predict",
                params={"key": settings.GEMINI_API_KEY},
                json={
                    "instances": [{"prompt": prompt}],
                    "parameters": {
                        "sampleCount": 1,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()

        duration_ms = int((time.perf_counter() - start) * 1000)

        image_base64 = data["predictions"][0]["bytesBase64Encoded"]
        image_bytes = __import__("base64").b64decode(image_base64)

        storage = get_storage()
        path = generate_image_path(publication_id)
        url = await storage.upload(image_bytes, path, content_type="image/png")

        return {
            "image_url": storage.get_url(path),
            "duration_ms": duration_ms,
            "cost_usd": None,
            "response_payload": data,
        }


class OpenAIService:
    async def generate_image(self, prompt: str, publication_id: str, size: str = "1024x1024") -> dict:
        start = time.perf_counter()

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,
                    "size": size,
                    "quality": "standard",
                },
            )
            response.raise_for_status()
            data = response.json()

        duration_ms = int((time.perf_counter() - start) * 1000)

        image_url = data["data"][0]["url"]
        async with httpx.AsyncClient(timeout=60) as client:
            img_response = await client.get(image_url)
            image_bytes = img_response.content

        storage = get_storage()
        path = generate_image_path(publication_id)
        url = await storage.upload(image_bytes, path, content_type="image/png")

        cost = 0.04 if size == "1024x1024" else 0.08

        return {
            "image_url": storage.get_url(path),
            "duration_ms": duration_ms,
            "cost_usd": cost,
            "response_payload": data,
        }


class OpenRouterService:
    async def generate_image(
        self, prompt: str, publication_id: str, model: str = "black-forest-labs/flux-1.1-pro"
    ) -> dict:
        start = time.perf_counter()

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "prompt": prompt,
                },
            )
            response.raise_for_status()
            data = response.json()

        duration_ms = int((time.perf_counter() - start) * 1000)
        image_url = data["data"][0]["url"]

        async with httpx.AsyncClient(timeout=60) as client:
            img_response = await client.get(image_url)
            image_bytes = img_response.content

        storage = get_storage()
        path = generate_image_path(publication_id)
        url = await storage.upload(image_bytes, path, content_type="image/png")

        return {
            "image_url": storage.get_url(path),
            "duration_ms": duration_ms,
            "cost_usd": None,
            "response_payload": data,
        }
