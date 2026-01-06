from extensions.mongo import db

admins = db["admins"]

def create_admin(doc: dict, session=None):
    return admins.insert_one(doc, session=session)

def get_admin_by_id(admin_id: str):
    return admins.find_one({"_id": admin_id})

def update_admin(admin_id: str, updates: dict, session=None):
    return admins.update_one(
        {"_id": admin_id},
        {"$set": updates},
        session=session
    )

def delete_admin(admin_id: str, session=None):
    return admins.delete_one(
        {"_id": admin_id},
        session=session
    )

def get_all_admins():
    return list(admins.find({}).sort("_id", 1))
