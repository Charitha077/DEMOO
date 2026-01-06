from datetime import datetime
from pymongo.errors import PyMongoError
from fastapi import HTTPException, status

# Security and Schemas
from security.passwords import hash_password
from schemas.admin_schema import Admin as AdminSchema

# Core Utilities
from core.http_errors import conflict
from core.global_response import success

# Repositories (Data Layer)
from data.admin_repo import (
    get_admin_by_id as repo_get_admin, # Rename to avoid conflict with service function
    update_admin as repo_update_admin,
    delete_admin as repo_delete_admin,
    get_all_admins as repo_get_all_admins
)
from data.roles_repo import get_role_by_name

# Extensions
from extensions.mongo import client, db

# ==========================================================
#  INTERNAL HELPER (The Fix for 404)
# ==========================================================
def find_admin_raw(admin_id: str):
    """Internal helper to fetch admin/superadmin without API wrapping."""
    # 1. Try finding in the standard admins collection
    admin = db["admins"].find_one({"_id": admin_id})
    
    # 2. FALLBACK: If not found, check the superadmins collection
    if not admin:
        admin = db["superadmins"].find_one({"_id": admin_id})
    
    # 3. SECOND FALLBACK: If your superadmin is in 'users', check there
    if not admin:
        admin = db["users"].find_one({"_id": admin_id})

    if admin:
        admin.pop("password_hash", None)
        admin["_id"] = str(admin["_id"]) # Ensure _id is a string for JSON
    return admin

# ==========================================================
#  GET ADMIN SERVICE
# ==========================================================
def get_admin_service(admin_id: str):
    try:
        admin = find_admin_raw(admin_id)
        if not admin:
            # Helpful debug print in console
            print(f"DEBUG: Profile lookup failed for ID: {admin_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile for {admin_id} not found in system"
            )
        return success("Profile fetched successfully", admin)
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database error")

# ==========================================================
#  REGISTER ADMIN
# ==========================================================
def register_admin(admin_id, name, phone, password, college):
    if repo_get_admin(admin_id):
        conflict(f"Admin {admin_id} already exists")

    admin_doc = AdminSchema(
        id=admin_id,
        name=name,
        phone=phone,
        password_hash=hash_password(password),
        college=college
    ).model_dump(by_alias=True)

    try:
        with client.start_session() as s:
            with s.start_transaction():
                db["admins"].insert_one(admin_doc, session=s)

                role_data = get_role_by_name("ADMIN")
                db["user_roles"].insert_one({
                    "user_id": admin_id,
                    "role_id": role_data["_id"],
                    "assigned_at": datetime.utcnow()
                }, session=s)
    except PyMongoError:
         raise HTTPException(status_code=500, detail="Admin DB insertion failed")

    return success("Admin registered successfully", {"admin_id": admin_id})


# ==========================================================
#  UPDATE ADMIN
# ==========================================================
def update_admin_service(admin_id, updates):
    admin = repo_get_admin(admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))

    try:
        repo_update_admin(admin_id, updates)
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Admin update failed")

    updated = find_admin_raw(admin_id)
    return success("Admin updated successfully", updated)

# ==========================================================
#  DELETE ADMIN
# ==========================================================
def delete_admin_service(admin_id):
    try:
        with client.start_session() as s:
            with s.start_transaction():
                repo_delete_admin(admin_id)
                db["user_roles"].delete_many({"user_id": admin_id}, session=s)
        return success("Admin deleted successfully")
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Failed to delete admin")

# ==========================================================
#  GET ALL ADMINS
# ==========================================================
def get_all_admins_service():
    try:
        admins = repo_get_all_admins()
        for a in admins:
            a.pop("password_hash", None)
            a["id"] = str(a.get("_id"))
        return success("All admins retrieved", admins)
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Failed to fetch admins")