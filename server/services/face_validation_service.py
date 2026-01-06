from datetime import datetime, timedelta
from typing import Tuple, Optional
from fastapi import HTTPException, status
import numpy as np
import cv2

from services.face_service import (
    decode_image,
    extract_embedding_and_landmarks,
    DUPLICATE_HIGH
)

from data.face_vectors_repo import search_similar_faces

# ==========================================================
# TEMP CACHE (UNCHANGED)
# ==========================================================
FACE_CACHE = {}
CACHE_EXPIRY_MINUTES = 5


# ==========================================================
# CACHE CLEANUP (UNCHANGED)
# ==========================================================
def cleanup_cache():
    now = datetime.utcnow()
    expired = [
        k for k, v in FACE_CACHE.items()
        if now - v["timestamp"] > timedelta(minutes=CACHE_EXPIRY_MINUTES)
    ]
    for k in expired:
        del FACE_CACHE[k]


# ==========================================================
# FACE VALIDATION (UPDATED SAFELY)
# ==========================================================
def validate_and_cache_face(image_b64: str) -> Tuple[bool, str]:
    """
    Pre-validates face before registration.

    Enforces:
    - Exactly one face
    - Valid embedding extraction
    - No global duplicate face
    """

    cleanup_cache()

    img, _ = decode_image(image_b64)

    # 🚨 This now enforces:
    # - No face
    # - Multiple faces
    emb, _ = extract_embedding_and_landmarks(img)
    emb_list = emb.tolist()

    try:
        matches = search_similar_faces(emb_list, limit=5)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Face similarity check failed"
        )

    for m in matches:
        if m.get("score", 0.0) >= DUPLICATE_HIGH:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Face already registered to user {m['user_id']}"
            )

    token = f"tmp_{datetime.utcnow().timestamp()}"
    FACE_CACHE[token] = {
        "image_b64": image_b64,
        "timestamp": datetime.utcnow()
    }

    return True, token


# ==========================================================
# GET CACHED FACE (UNCHANGED)
# ==========================================================
def get_cached_face(temp_token: str) -> Optional[str]:
    cleanup_cache()
    return FACE_CACHE.get(temp_token, {}).get("image_b64")
