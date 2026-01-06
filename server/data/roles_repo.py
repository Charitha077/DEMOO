from extensions.mongo import db

roles = db["roles"]

def create_role_if_not_exists(name: str):
    existing = roles.find_one({"name": name})
    if existing:
        return existing

    new_role = {"name": name}
    res = roles.insert_one(new_role)
    return roles.find_one({"_id": res.inserted_id})

def get_role_by_name(name: str):
    return roles.find_one({"name": name})

def get_role_by_id(role_id: str):
    return roles.find_one({"_id": role_id})

def get_all_roles():
    return list(roles.find({}))
