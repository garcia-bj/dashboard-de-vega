from typing import Any
import httpx
import json as _json
from app.config import get_settings

settings = get_settings()


class MetaService:
    GRAPH_URL = "https://graph.facebook.com/v19.0"

    async def _call_graph_api(
        self, endpoint: str, access_token: str, method: str = "POST", data: dict | None = None
    ) -> dict:
        url = f"{self.GRAPH_URL}/{endpoint}"
        params = {"access_token": access_token}

        async with httpx.AsyncClient(timeout=60) as client:
            if method == "POST":
                if "/media" in endpoint or "/photos" in endpoint:
                    response = await client.post(url, params=params, json=data)
                else:
                    response = await client.post(url, params=params, data=data)
            else:
                response = await client.get(url, params={**params, **(data or {})})

            if response.status_code == 403:
                try:
                    err = response.json()
                    fb_msg = err.get("error", {}).get("message", "")
                except Exception:
                    fb_msg = ""
                raise Exception(
                    f"403 Forbidden de Meta API — el token no tiene permisos suficientes o "
                    f"es un User Token en vez de Page Token. "
                    f"Solución: ve a Configuración → Redes Sociales, elimina la cuenta y vuelve a guardar tu token. "
                    f"Detalle: {fb_msg}"
                )

            response.raise_for_status()
            return response.json()

    async def publish_to_feed(
        self, page_id: str, access_token: str, image_url: str, caption: str = ""
    ) -> dict:
        result = await self._call_graph_api(
            f"{page_id}/photos",
            access_token,
            data={"url": image_url, "caption": caption},
        )
        return {
            "post_id": result.get("post_id") or result.get("id"),
            "permalink": f"https://www.facebook.com/{result.get('post_id') or result.get('id')}",
        }

    async def publish_to_instagram(
        self,
        instagram_business_id: str,
        access_token: str,
        image_url: str,
        caption: str = "",
    ) -> dict:
        container = await self._call_graph_api(
            f"{instagram_business_id}/media",
            access_token,
            data={
                "image_url": image_url,
                "caption": caption,
            },
        )
        container_id = container.get("id")

        publish = await self._call_graph_api(
            f"{instagram_business_id}/media_publish",
            access_token,
            data={"creation_id": container_id},
        )
        return {
            "post_id": publish.get("id"),
            "permalink": f"https://www.instagram.com/p/{publish.get('id', '').split('_')[0]}/",
        }

    async def publish_to_story(
        self,
        instagram_business_id: str,
        access_token: str,
        image_url: str,
    ) -> dict:
        container = await self._call_graph_api(
            f"{instagram_business_id}/media",
            access_token,
            data={
                "image_url": image_url,
                "media_type": "STORIES",
            },
        )
        container_id = container.get("id")

        publish = await self._call_graph_api(
            f"{instagram_business_id}/media_publish",
            access_token,
            data={"creation_id": container_id},
        )
        return {
            "post_id": publish.get("id"),
            "permalink": f"https://www.instagram.com/stories/direct/{publish.get('id')}",
        }

    async def publish_carousel_to_feed(
        self, page_id: str, access_token: str, image_urls: list[str], caption: str = ""
    ) -> dict:
        # 1. Upload each image as an unpublished photo to get photo IDs
        photo_ids = []
        for url in image_urls:
            r = await self._call_graph_api(
                f"{page_id}/photos", access_token,
                data={"url": url, "published": "false"},
            )
            photo_ids.append(r["id"])

        # 2. Create the carousel feed post with attached media
        r = await self._call_graph_api(
            f"{page_id}/feed", access_token,
            data={
                "message": caption,
                "attached_media": _json.dumps([{"media_fbid": pid} for pid in photo_ids]),
            },
        )
        return {
            "post_id": r.get("id"),
            "permalink": f"https://www.facebook.com/{r.get('id')}",
        }

    async def publish_carousel_to_instagram(
        self, instagram_business_id: str, access_token: str, image_urls: list[str], caption: str = ""
    ) -> dict:
        # 1. Create item containers (one per image)
        children_ids = []
        for url in image_urls:
            r = await self._call_graph_api(
                f"{instagram_business_id}/media", access_token,
                data={"image_url": url, "is_carousel_item": "true"},
            )
            children_ids.append(r["id"])

        # 2. Create carousel container
        r = await self._call_graph_api(
            f"{instagram_business_id}/media", access_token,
            data={
                "media_type": "CAROUSEL",
                "caption": caption,
                "children": ",".join(children_ids),
            },
        )
        carousel_id = r["id"]

        # 3. Publish
        r = await self._call_graph_api(
            f"{instagram_business_id}/media_publish", access_token,
            data={"creation_id": carousel_id},
        )
        return {
            "post_id": r.get("id"),
            "permalink": f"https://www.instagram.com/p/{r.get('id', '').split('_')[0]}/",
        }

    async def exchange_token(self, short_lived_token: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self.GRAPH_URL}/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": settings.META_APP_ID,
                    "client_secret": settings.META_APP_SECRET,
                    "fb_exchange_token": short_lived_token,
                },
            )
            response.raise_for_status()
            return response.json()

    async def get_pages(self, access_token: str) -> list[dict]:
        result = await self._call_graph_api(
            "me/accounts", access_token, method="GET", data={"fields": "id,name,access_token"}
        )
        return result.get("data", [])

    async def get_instagram_accounts(self, page_id: str, access_token: str) -> dict:
        return await self._call_graph_api(
            f"{page_id}",
            access_token,
            method="GET",
            data={"fields": "instagram_business_account{id,username,profile_picture_url}"},
        )
