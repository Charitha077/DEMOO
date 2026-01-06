from datetime import datetime
from pymongo.errors import PyMongoError
from fastapi import HTTPException, status

from security.passwords import hash_password
from schemas.guard_schema import Guard as GuardSchema

from data.guards_repo import (
    get_guard_by_id,
    create_guard as repo_create_guard,
    update_guard as repo_update_guard,
    delete_guard as repo_delete_guard,
    get_all_guards
)

from data.roles_repo import get_role_by_name
from data.faces_repo import get_face_by_user, delete_face
from data.face_vectors_repo import delete_vector

from extensions.mongo import client, db
from core.global_response import success


# =======================================================
# REGISTER GUARD
# =======================================================
def register_guard(guard_id, name, phone, password,college):
    # validate_college(college)

    if get_guard_by_id(guard_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{guard_id} is already registered"
        )

    guard_doc = GuardSchema(
        _id=guard_id,
        name=name,
        phone=phone,
        password_hash=hash_password(password),
        college=college
    ).model_dump(by_alias=True)

    try:
        with client.start_session() as s:
            with s.start_transaction():

                db["guards"].insert_one(guard_doc, session=s)

                role = get_role_by_name("GUARD")
                db["user_roles"].insert_one({
                    "user_id": guard_id,
                    "role_id": role["_id"],
                    "assigned_at": datetime.utcnow()
                }, session=s)

    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Guard registration failed"
        )

    return success("Guard registered successfully", {"guard_id": guard_id})


# =======================================================
# UPDATE GUARD
# =======================================================
def update_guard_service(guard_id, updates):
    guard = get_guard_by_id(guard_id)
    if not guard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guard not found"
        )

    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))

    try:
        with client.start_session() as s:
            with s.start_transaction():
                repo_update_guard(guard_id, updates)

    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Guard update failed"
        )

    updated = get_guard_by_id(guard_id)
    if updated:
        updated.pop("password_hash", None)

    return success("Guard updated successfully", updated)


# =======================================================
# DELETE GUARD
# =======================================================
def delete_guard_service(guard_id):
    old = get_face_by_user(guard_id)
    vec = old.get("vector_ref") if old else None
    face_id = old.get("_id") if old else None

    try:
        with client.start_session() as s:
            with s.start_transaction():

                if vec:
                    delete_vector(vec, session=s)
                if face_id:
                    delete_face(face_id, session=s)

                repo_delete_guard(guard_id)
                db["user_roles"].delete_many({"user_id": guard_id}, session=s)

    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete guard"
        )

    return success("Guard deleted successfully")



# =======================================================
# INTERNAL GETTER (Repository Layer)
# =======================================================
def get_guard_by_id(guard_id):
    return db["guards"].find_one({"_id": guard_id})

# =======================================================
# GET GUARD BY ID (Service Layer called by Route)
# =======================================================
def service_get_guard_by_id(guard_id: str):
    try:
        guard = get_guard_by_id(guard_id)
        if not guard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guard not found"
            )

        # Remove password for security before sending to UI
        if isinstance(guard, dict):
            guard.pop("password_hash", None)

        # Return with the success wrapper
        return success("Guard retrieved successfully", guard)

    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while retrieving guard"
        )

# =======================================================
# GET ALL GUARDS
# =======================================================
def service_get_all_guards():
    try:
        guards = get_all_guards()
        cleaned = []

        for g in guards:
            g.pop("password_hash", None)

            face_info = None
            face_doc = get_face_by_user(g["_id"])
            if face_doc:
                face_info = {
                    "face_id": str(face_doc["_id"]),
                    "vector_ref": face_doc.get("vector_ref")
                }

            g["face_info"] = face_info
            cleaned.append(g)

        return success("All guards retrieved successfully", cleaned)

    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while retrieving guards"
        )
