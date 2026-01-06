from extensions.mongo import db
from bson import ObjectId

assignments = db["mentor_assignments"]


def create_assignment(doc: dict, session=None):
    return assignments.insert_one(doc, session=session)


def delete_assignments_for_semester(college: str, academic_year: str, semester: int, session=None):
    return assignments.delete_many({
        "college": college,
        "academic_year": academic_year,
        "semester": semester
    }, session=session)


def get_assignments_for_student(college: str, course: str, section: str, semester: int, academic_year: str, roll_number: int | None = None):
    query = {
        "college": college,
        "course": course,
        "section": section,
        "semester": semester,
        "academic_year": academic_year
    }
    cursor = assignments.find(query)
    results = []
    for a in cursor:
        if roll_number is not None:
            start = a.get("roll_start")
            end = a.get("roll_end")
            if start is not None and roll_number < start:
                continue
            if end is not None and roll_number > end:
                continue
        results.append(a)
    return results


def get_assignment_by_id(assignment_id: str):
    try:
        return assignments.find_one({"_id": ObjectId(assignment_id)})
    except Exception:
        return None


def list_assignments(filter_query: dict | None = None):
    return list(assignments.find(filter_query or {}))
