from extensions.mongo import db

superadmins = db["superadmins"]

def get_superadmin_by_id(superadmin_id: str):
    return superadmins.find_one({"_id": superadmin_id})

def create_superadmin(doc: dict):
    return superadmins.insert_one(doc)
