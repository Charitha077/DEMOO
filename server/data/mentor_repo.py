from extensions.mongo import db

mentors = db["mentors"]


def get_mentor_by_id(mentor_id: str):
    return mentors.find_one({"_id": mentor_id})


def create_mentor(doc: dict, session=None):
    return mentors.insert_one(doc, session=session)


def update_mentor(mentor_id: str, updates: dict, session=None):
    return mentors.update_one({"_id": mentor_id}, {"$set": updates}, session=session)


def delete_mentor(mentor_id: str, session=None):
    return mentors.delete_one({"_id": mentor_id}, session=session)


def list_mentors(filter_query: dict | None = None):
    return list(mentors.find(filter_query or {}))
