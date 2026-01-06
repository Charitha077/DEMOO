from datetime import datetime
from pymongo.errors import PyMongoError
from fastapi import HTTPException, status

from security.passwords import hash_password
from schemas.mentor_schema import Mentor as MentorSchema

from data.mentor_repo import (
    get_mentor_by_id,
    create_mentor as repo_create_mentor,
    update_mentor as repo_update_mentor,
    delete_mentor as repo_delete_mentor,
    list_mentors as repo_list_mentors,
)

from data.roles_repo import get_role_by_name
from extensions.mongo import client, db
from core.global_response import success


def register_mentor(mentor_id, name, phone, department, password):
    if get_mentor_by_id(mentor_id):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Mentor already exists")

    mentor_doc = MentorSchema(
        _id=mentor_id,
        name=name,
        phone=phone,
        department=department,
        password_hash=hash_password(password)
    ).model_dump(by_alias=True)

    try:
        with client.start_session() as s:
            with s.start_transaction():
                repo_create_mentor(mentor_doc, session=s)
                role = get_role_by_name("MENTOR")
                db["user_roles"].insert_one({
                    "user_id": mentor_id,
                    "role_id": role["_id"],
                    "assigned_at": datetime.utcnow()
                }, session=s)
    except PyMongoError:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Mentor registration failed")

    return success("Mentor registered", {"mentor_id": mentor_id})


def update_mentor_service(mentor_id, updates):
    mentor = get_mentor_by_id(mentor_id)
    if not mentor:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Mentor not found")

    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))

    try:
        with client.start_session() as s:
            with s.start_transaction():
                repo_update_mentor(mentor_id, updates, session=s)
    except PyMongoError:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Mentor update failed")

    updated = get_mentor_by_id(mentor_id)
    if updated:
        updated.pop("password_hash", None)
    return success("Mentor updated", updated)


def delete_mentor_service(mentor_id):
    try:
        with client.start_session() as s:
            with s.start_transaction():
                repo_delete_mentor(mentor_id, session=s)
                db["user_roles"].delete_many({"user_id": mentor_id}, session=s)
    except PyMongoError:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Mentor delete failed")
    return success("Mentor deleted")


def list_mentors_service(filters=None):
    mentors = repo_list_mentors(filters or {})
    for m in mentors:
        m.pop("password_hash", None)
    return success("Mentors fetched", mentors)
