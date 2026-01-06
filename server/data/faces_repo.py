from extensions.mongo import db
from bson import ObjectId
from datetime import datetime

faces = db["faces"]

def create_face_doc(user_id, user_type, image_bytes, vector_ref, session=None):
    doc = {
        "user_id": user_id,
        "user_type": user_type,
        "image_data": image_bytes,
        "vector_ref": vector_ref,
        "created_at": datetime.utcnow()
    }
    res = faces.insert_one(doc, session=session)
    return str(res.inserted_id)

def get_face_by_id(face_id: str):
    return faces.find_one({"_id": ObjectId(face_id)})

def get_face_by_user(user_id: str):
    return faces.find_one({"user_id": user_id})

def delete_face(face_id: str, session=None):
    return faces.delete_one(
        {"_id": ObjectId(face_id)},
        session=session
    )
