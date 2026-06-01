import httpx
from app.config import get_settings

settings = get_settings()


async def trigger_image_generation_workflow(prompt: str, ai_model: str, user_id: str) -> dict:
    webhook_url = f"{settings.N8N_WEBHOOK_URL}{settings.N8N_IMAGE_GEN_WEBHOOK}"
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            webhook_url,
            json={
                "prompt": prompt,
                "ai_model": ai_model,
                "user_id": user_id,
            },
        )
        response.raise_for_status()
        return response.json()


async def trigger_auto_publish_workflow(publication_id: str) -> dict:
    webhook_url = f"{settings.N8N_WEBHOOK_URL}{settings.N8N_PUBLISH_WEBHOOK}"
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            webhook_url,
            json={"publication_id": publication_id},
        )
        response.raise_for_status()
        return response.json()
