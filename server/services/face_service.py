import cv2
import base64
import numpy as np
from datetime import datetime
from pymongo.errors import PyMongoError
from fastapi import HTTPException, status

from insightface.app import FaceAnalysis

from extensions.mongo import client, db
from data.faces_repo import (
    get_face_by_user,
    delete_face,
    create_face_doc
)
from data.face_vectors_repo import (
    get_vector,
    create_vector,
    delete_vector,
    search_similar_faces
)

# ===============================================================
# MODEL INITIALIZATION
# ===============================================================
try:
    face_model = FaceAnalysis(name="buffalo_l")
    face_model.prepare(ctx_id=-1, det_size=(640, 640))
except Exception as e:
    print("❌ Face model load failed:", e)
    face_model = None


# ===============================================================
# THRESHOLDS (UNCHANGED)
# ===============================================================
VERIFY_THRESHOLD = 0.55
DUPLICATE_HIGH = 0.65
AMBIGUOUS_LOW = 0.50
LANDMARK_TWIN_THRESHOLD = 18.0


# ===============================================================
# IMAGE DECODER
# ===============================================================
def decode_image(b64):
    try:
        if "," in b64:
            b64 = b64.split(",")[1]
        img_bytes = base64.b64decode(b64)
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError()
        return img, None
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted image"
        )


# ===============================================================
# 🚨 FACE COUNT ENFORCEMENT (NEW)
# ===============================================================
def ensure_single_face(img):
    faces = face_model.get(img,max_num=1)

    if not faces:
        raise HTTPException(
            status_code=400,
            detail="No face detected. Ensure your face is visible."
        )

    if len(faces) > 1:
        raise HTTPException(
            status_code=400,
            detail="Multiple faces detected. Only one person allowed."
        )

    return faces[0]


# ===============================================================
# EMBEDDING EXTRACTION (UNCHANGED LOGIC)
# ===============================================================
def extract_embedding_and_landmarks(img):
    face = ensure_single_face(img)

    emb = face.embedding.astype(np.float32)
    lm = face.landmark_3d_68.astype(np.float32)

    return emb, lm


def landmark_distance(a, b):
    return float(np.linalg.norm(a.flatten() - b.flatten()))


# ===============================================================
# VERIFICATION
# ===============================================================
def verify_face_for_user(user_id, b64):
    face = get_face_by_user(user_id)
    if not face:
        raise HTTPException(404, "Face not registered")

    vector = get_vector(face["vector_ref"])
    if not vector:
        raise HTTPException(500, "Stored face vector missing")

    saved_emb = np.array(vector["embedding"], np.float32)

    img, _ = decode_image(b64)
    emb, lm1 = extract_embedding_and_landmarks(img)

    score = float(
        np.dot(saved_emb, emb)
        / (np.linalg.norm(saved_emb) * np.linalg.norm(emb))
    )

    print(f"[VERIFY] {user_id} | score={score:.3f}")

    if score < VERIFY_THRESHOLD:
        return False, score

    if score < DUPLICATE_HIGH:
        img2 = cv2.imdecode(
            np.frombuffer(face["image_data"], np.uint8),
            cv2.IMREAD_COLOR
        )
        _, lm2 = extract_embedding_and_landmarks(img2)

        if landmark_distance(lm1, lm2) > LANDMARK_TWIN_THRESHOLD:
            raise HTTPException(
                status_code=403,
                detail="Identity ambiguous (Twin or spoof detected)"
            )

    return True, score


# ===============================================================
# SAVE / REPLACE FACE (UNCHANGED FLOW)
# ===============================================================
def save_face_replace(user_id, user_type, b64):
    img, _ = decode_image(b64)
    emb, _ = extract_embedding_and_landmarks(img)
    emb_list = emb.tolist()

    matches = search_similar_faces(emb_list, limit=5)
    for m in matches:
        if m.get("score", 0.0) >= DUPLICATE_HIGH and m["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Face already registered to user {m['user_id']}"
            )

    vector_id = f"vec_{user_id}"

    try:
        with client.start_session() as session:
            with session.start_transaction():
                old = get_face_by_user(user_id)
                if old:
                    delete_vector(old["vector_ref"], session=session)
                    delete_face(old["_id"], session=session)

                create_vector(vector_id, user_id, emb_list, session=session)

                ok, buf = cv2.imencode(".jpg", img)
                face_id = create_face_doc(
                    user_id,
                    user_type,
                    buf.tobytes(),
                    vector_id,
                    session=session
                )

                col_map = {
                    "STUDENT": "students",
                    "ADMIN": "admins",
                    "HOD": "hods",
                    "SUPER_ADMIN": "superadmins"
                }

                db[col_map[user_type.upper()]].update_one(
                    {"_id": user_id},
                    {"$set": {
                        "face_id": str(face_id),
                        "updated_at": datetime.utcnow()
                    }},
                    session=session
                )
        return True

    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Failed to save biometric data"
        )


# ===============================================================
# VERIFY THEN REPLACE (UNCHANGED)
# ===============================================================
def verify_then_replace_face(user_id, user_type, b64):
    try:
        verify_face_for_user(user_id, b64)
        save_face_replace(user_id, user_type, b64)
    except HTTPException as e:
        if e.status_code == 404:
            save_face_replace(user_id, user_type, b64)
        else:
            raise
