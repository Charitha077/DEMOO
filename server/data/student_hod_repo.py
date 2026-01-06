from extensions.mongo import db

student_hod = db["student_hod"]

# ==========================================================
# CREATE / UPDATE MAPPING
# ==========================================================
def map_student_to_hod(
    student_id: str,
    hod_id: str,
    year: int,
    course: str,
    college: str,
    session=None
):
    doc = {
        "student_id": student_id,
        "hod_id": hod_id,
        "year": year,          # ✅ FIXED (actual value)
        "course": course,
        "college": college
    }

    student_hod.update_one(
        {"student_id": student_id, "hod_id": hod_id},
        {"$set": doc},
        upsert=True,
        session=session
    )


# ==========================================================
# READ
# ==========================================================
def get_hods_for_student(student_id: str):
    return list(student_hod.find({"student_id": student_id}))


def get_students_for_hod(hod_id: str):
    return list(student_hod.find({"hod_id": hod_id}))


# ==========================================================
# DELETE
# ==========================================================
def delete_student_mappings(student_id: str, session=None):
    return student_hod.delete_many(
        {"student_id": student_id},
        session=session
    )


def delete_hod_mappings(hod_id: str, session=None):
    return student_hod.delete_many(
        {"hod_id": hod_id},
        session=session
    )
