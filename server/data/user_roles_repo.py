from extensions.mongo import db

user_roles = db["user_roles"]

def assign_role(user_id: str, role_id: str, session=None):
    return user_roles.update_one(
        {"user_id": user_id},
        {"$set": {"user_id": user_id, "role_id": role_id}},
        upsert=True,
        session=session
    )

def get_user_role(user_id: str):
    return user_roles.find_one({"user_id": user_id})

def delete_user_role(user_id: str, session=None):
    return user_roles.delete_many(
        {"user_id": user_id},
        session=session
    )
