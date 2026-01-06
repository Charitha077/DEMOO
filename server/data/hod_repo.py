from extensions.mongo import db

hods = db["hods"]

def get_hod_by_id(hod_id: str):
    return hods.find_one({"_id": hod_id})

def create_hod(doc: dict, session=None):
    return hods.insert_one(doc, session=session)

def update_hod(hod_id: str, updates: dict, session=None):
    return hods.update_one(
        {"_id": hod_id},
        {"$set": updates},
        session=session
    )

def delete_hod(hod_id: str, session=None):
    return hods.delete_one(
        {"_id": hod_id},
        session=session
    )

def get_all_hods():
    return list(hods.find({}).sort("_id", 1))

def filter_hods(filters: dict):
    query = {}
    for key, value in filters.items():
        if value is None:
            continue
        if key in ["years", "courses"]:
            query[key] = {"$in": value if isinstance(value, list) else [value]}
        else:
            query[key] = value
    return list(hods.find(query).sort("_id", 1))
