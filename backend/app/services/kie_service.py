"""Kie.ai unified Jobs API client (video generation).

Docs: POST /api/v1/jobs/createTask  ·  GET /api/v1/jobs/recordInfo?taskId=
Seedance 2 input: prompt, reference_image_urls (≤9), reference_video_urls (≤3),
aspect_ratio, resolution, duration (4-15s), generate_audio.
"""
import asyncio
import json
import logging
import httpx

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("kie")


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.KIE_API_KEY}",
        "Content-Type": "application/json",
    }


async def create_task(input_dict: dict, model: str | None = None) -> str:
    """Submit a generation job, return the taskId."""
    payload = {"model": model or settings.KIE_VIDEO_MODEL, "input": input_dict}
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{settings.KIE_BASE_URL.rstrip('/')}/api/v1/jobs/createTask",
            headers=_headers(),
            json=payload,
        )
        r.raise_for_status()
        data = r.json()
    if data.get("code") != 200:
        logger.error("Kie createTask rechazó: code=%s msg=%s", data.get("code"), data.get("msg"))
        raise RuntimeError(data.get("msg") or "Kie createTask falló")
    task_id = data["data"]["taskId"]
    logger.info("Kie task creada: %s (model=%s)", task_id, payload["model"])
    return task_id


async def wait_for_result(task_id: str, poll_s: int = 6, timeout_s: int = 900) -> str:
    """Poll recordInfo until success; return the result video URL.

    Raises on fail/timeout. ponytail: in-process polling, fine for low volume —
    move to a real queue (Celery/RQ) if many concurrent jobs are needed.
    """
    waited = 0
    last_state = None
    base = f"{settings.KIE_BASE_URL.rstrip('/')}/api/v1/jobs/recordInfo"
    while waited < timeout_s:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(base, params={"taskId": task_id}, headers=_headers())
            r.raise_for_status()
            d = r.json().get("data") or {}
        state = d.get("state")
        if state != last_state:
            logger.info("Kie task %s estado=%s (progress=%s)", task_id, state, d.get("progress"))
            last_state = state
        if state == "success":
            urls = json.loads(d.get("resultJson") or "{}").get("resultUrls") or []
            if not urls:
                raise RuntimeError("Kie devolvió success sin URL de resultado")
            logger.info("Kie task %s lista: %s", task_id, urls[0])
            return urls[0]
        if state == "fail":
            raise RuntimeError(d.get("failMsg") or "La generación falló en Kie")
        await asyncio.sleep(poll_s)
        waited += poll_s
    raise RuntimeError("La generación superó el tiempo máximo de espera (15 min)")
