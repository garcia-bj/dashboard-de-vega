from typing import Any
import httpx
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
