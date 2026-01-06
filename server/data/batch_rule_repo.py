from extensions.mongo import db
from bson import ObjectId

batch_rules = db["batch_rules"]


def create_batch_rule(doc: dict, session=None):
    return batch_rules.insert_one(doc, session=session)


def list_batch_rules(filter_query: dict | None = None):
    return list(batch_rules.find(filter_query or {}))


def get_batch_for_student(college: str, course: str, section: str, semester: int, academic_year: str, roll_number: int | None = None):
    query = {
        "college": college,
        "course": course,
        "section": section,
        "semester": semester,
        "academic_year": academic_year
    }
    cursor = batch_rules.find(query)
    for rule in cursor:
        if roll_number is not None:
            start = rule.get("roll_start")
            end = rule.get("roll_end")
            if start is not None and roll_number < start:
                continue
            if end is not None and roll_number > end:
                continue
        return rule
    return None


def delete_batch_rule(rule_id: str, session=None):
    try:
        return batch_rules.delete_one({"_id": ObjectId(rule_id)}, session=session)
    except Exception:
        return None
