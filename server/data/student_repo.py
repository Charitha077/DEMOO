from extensions.mongo import db

students = db["students"]

def create_student(doc: dict, session=None):
    return students.insert_one(doc, session=session)

def get_student_by_id(student_id: str):
    return students.find_one({"_id": student_id})

def update_student(student_id: str, updates: dict, session=None):
    return students.update_one(
        {"_id": student_id},
        {"$set": updates},
        session=session
    )

def delete_student(student_id: str, session=None):
    return students.delete_one(
        {"_id": student_id},
        session=session
    )

def get_all_students():
    return list(students.find({}).sort("_id", 1))

def delete_students_by_year_and_college_repo(year: str, college: str, session=None):
    return students.delete_many(
        {"year": year, "college": college},
        session=session
    )

def get_students_by_year_and_college(year: str, college: str):
    return list(students.find({"year": year, "college": college}).sort("_id", 1))

def promote_students_year_repo(year: str, college: str, new_year: str, session=None):
    return students.update_many(
        {"year": year, "college": college},
        {"$set": {"year": new_year}},
        session=session
    )

def filter_students(filters: dict):
    query = {k: v for k, v in filters.items() if v is not None}
    return list(students.find(query).sort("_id", 1))
