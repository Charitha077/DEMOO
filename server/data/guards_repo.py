from extensions.mongo import db

guards = db["guards"]

def get_guard_by_id(guard_id: str):
    return guards.find_one({"_id": guard_id})

def create_guard(doc: dict, session=None):
    return guards.insert_one(doc, session=session)

def update_guard(guard_id: str, updates: dict, session=None):
    return guards.update_one(
        {"_id": guard_id},
        {"$set": updates},
        session=session
    )

def delete_guard(guard_id: str, session=None):
    return guards.delete_one(
        {"_id": guard_id},
        session=session
    )

def get_all_guards():
    return list(guards.find().sort("_id", 1))
