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

            if not response.is_success:
                try:
                    err_body = response.json()
                    api_err = err_body.get("error", {})
                    api_msg = api_err.get("message", "")
                    api_code = api_err.get("code", "")
                    api_sub  = api_err.get("error_subcode", "")
                except Exception:
                    api_msg, api_code, api_sub = response.text[:300], "", ""

                if response.status_code == 403:
                    raise Exception(
                        f"403 Sin permisos — el token no tiene acceso a este recurso o es un "
                        f"User Token en vez de Page Token. Ve a Configuración → Redes Sociales, "
                        f"elimina la cuenta y vuelve a guardar el token. "
                        f"Meta dice: {api_msg} (code={api_code})"
                    )

                raise Exception(
                    f"Meta API {response.status_code}: {api_msg}"
                    + (f" (code={api_code}" + (f", sub={api_sub}" if api_sub else "") + ")" if api_code else "")
                )

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

    async def publish_to_facebook_story(
        self, page_id: str, access_token: str, image_url: str
    ) -> dict:
        # Upload photo as non-published temporary asset
        photo = await self._call_graph_api(
            f"{page_id}/photos", access_token,
            data={"url": image_url, "published": "false", "temporary": "true"},
        )
        photo_id = photo.get("id")
        if not photo_id:
            raise Exception("No se pudo subir la foto para la historia de Facebook")

        # Publish as page photo story
        result = await self._call_graph_api(
            f"{page_id}/photo_stories", access_token,
            data={"photo_id": photo_id},
        )
        return {
            "post_id": result.get("id") or photo_id,
            "permalink": f"https://www.facebook.com/{page_id}",
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
