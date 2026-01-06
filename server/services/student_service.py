import cv2
from datetime import datetime
from pymongo.errors import PyMongoError
from fastapi import HTTPException, status

from security.passwords import hash_password
from schemas.student_schema import Student as StudentSchema

from data.student_repo import (
    get_student_by_id as repo_get_student_by_id, 
    update_student as repo_update_student,
    delete_student as repo_delete_student,
    filter_students as filter_students_repo,
    promote_students_year_repo,
    get_students_by_year_and_college
)

from data.roles_repo import get_role_by_name
from data.faces_repo import get_face_by_user, delete_face, create_face_doc
from data.face_vectors_repo import create_vector, delete_vector, search_similar_faces
from data.student_hod_repo import map_student_to_hod, delete_student_mappings
from data.hod_repo import get_all_hods
from extensions.mongo import client, db
from services.validators import validate_college
from services.face_service import decode_image, extract_embedding_and_landmarks, DUPLICATE_HIGH
from core.global_response import success

# ==========================================================
# CREATE STUDENT
# ==========================================================
def validate_semester_for_year(admission_year: int, current_semester: int):
    """Validate that semester matches academic year level"""
    from datetime import datetime
    now = datetime.utcnow()
    current_year = now.year
    
    # Calculate year level based on admission year
    year_level = current_year - admission_year + 1
    if now.month < 6:  # Before June, still in previous academic year
        year_level = current_year - admission_year
    
    # Ensure year_level is 1-4
    year_level = max(1, min(4, year_level))
    
    # Map year to allowed semesters
    allowed_sems = {
        1: [1, 2],
        2: [3, 4],
        3: [5, 6],
        4: [7, 8]
    }
    
    if current_semester not in allowed_sems.get(year_level, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Year {year_level} students can only be in semesters {allowed_sems[year_level]}, not {current_semester}"
        )

def register_student(student_id, name, phone, admission_year, current_semester, course, section, college, password, created_by):
    validate_college(college)
    validate_semester_for_year(admission_year, current_semester)
    
    if repo_get_student_by_id(student_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Student already exists")

    student_doc = StudentSchema(
        _id=student_id, name=name, phone=phone, admission_year=admission_year,
        current_semester=current_semester, course=course, section=section, college=college,
        created_by=created_by, password_hash=hash_password(password),
        face_id=None
    ).model_dump(by_alias=True)

    try:
        with client.start_session() as s:
           with s.start_transaction():
            db["students"].insert_one(student_doc, session=s)

            role = get_role_by_name("STUDENT")
            db["user_roles"].insert_one({
                "user_id": student_id,
                "role_id": role["_id"],
                "assigned_at": datetime.utcnow()
            }, session=s)

            # ✅ CREATE STUDENT–HOD MAPPINGS
            hods = get_all_hods()
            from math import ceil
            year_level = ceil(current_semester / 2)
            for h in hods:
                if (
                    h["college"] == college
                    and year_level in h["years"]
                    and course == h["courses"]
                ):
                    map_student_to_hod(
                        student_id,
                        h["_id"],
                        year_level,
                        course,
                        college,
                        session=s
                    )

    except PyMongoError:
        raise HTTPException(status_code=500, detail="Student creation failed")
    return success("Student created successfully", {"student_id": student_id})

# ==========================================================
# REGISTER FACE
# ==========================================================
def register_student_face_service(student_id: str, image_b64: str):
    student = repo_get_student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if student.get("face_id"):
        raise HTTPException(status_code=409, detail="Face already registered")

    img, _ = decode_image(image_b64)
    emb, _, _ = extract_embedding_and_landmarks(img)
    emb_list = emb.tolist()
    matches = search_similar_faces(emb_list)
    for m in matches:
        if m["score"] >= DUPLICATE_HIGH:
            raise HTTPException(status_code=409, detail=f"Duplicate face detected")

    vector_id = f"vec_{student_id}"
    try:
        with client.start_session() as s:
            with s.start_transaction():
                create_vector(vector_id, student_id, emb_list, session=s)
                ok, buf = cv2.imencode(".jpg", img)
                face_id = create_face_doc(student_id, "STUDENT", buf.tobytes(), vector_id, session=s)
                db["students"].update_one({"_id": student_id}, {"$set": {"face_id": face_id}}, session=s)
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Face registration failed")
    return success("Face registered successfully")

# ==========================================================
# UPDATE STUDENT (RESTORED)
# ==========================================================
def update_student_service(student_id, updates):
    student = repo_get_student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    sensitive_fields = {"current_semester", "course", "college"}
    needs_remap = any(f in updates for f in sensitive_fields)

    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))

    try:
        with client.start_session() as s:
            with s.start_transaction():
                repo_update_student(student_id, updates, session=s)

                if needs_remap:
                    delete_student_mappings(student_id, session=s)

                    updated = repo_get_student_by_id(student_id)

                    hods = get_all_hods()
                    for h in hods:
                        if (
                            h["college"] == updated["college"]
                            and updated["current_semester"] in h["years"]
                            and updated["course"] in h["courses"]
                        ):
                            map_student_to_hod(
                                student_id,
                                h["_id"],
                                updated["current_semester"],
                                updated["course"],
                                updated["college"],
                                session=s
                            )

    except PyMongoError:
        raise HTTPException(status_code=500, detail="Student update failed")

    updated = repo_get_student_by_id(student_id)
    updated.pop("password_hash", None)
    return success("Student updated successfully", updated)


# ==========================================================
# DELETE STUDENT
# ==========================================================
def delete_student_service(student_id):
    face = get_face_by_user(student_id)
    try:
        with client.start_session() as s:
          with s.start_transaction():
            if face:
                if face.get("vector_ref"):
                    delete_vector(face["vector_ref"], session=s)
                delete_face(face["_id"], session=s)

            repo_delete_student(student_id, session=s)
            delete_student_mappings(student_id, session=s)
            db["user_roles"].delete_many({"user_id": student_id}, session=s)

    except PyMongoError:
        raise HTTPException(status_code=500, detail="Delete failed")
    delete_student_mappings(student_id)
    return success("Student deleted successfully")

# ==========================================================
# GET STUDENT
# ==========================================================
def get_student_service(student_id: str):
    student = repo_get_student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.pop("password_hash", None)
    return success("Student fetched", student)

# ==========================================================
# OTHERS
# ==========================================================
def filter_students_service(filters: dict):
    return success("Filtered students", filter_students_repo(filters))

def promote_students_service(admission_year: int, college: str):
    """
    Promote all students from admission_year in college to next semester and year.
    Increments current_semester by 2 (e.g., 1→3, 3→5, 5→7) and year by 1.
    Prevents 4th year students from being promoted beyond semester 8.
    """
    students = list(db["students"].find({
        "admission_year": admission_year,
        "college": college
    }))
    
    if not students:
        return success(f"No students found for admission_year {admission_year} in {college}", {"promoted_count": 0})
    
    count = 0
    errors = []
    
    try:
        with client.start_session() as s:
            with s.start_transaction():
                for student in students:
                    current_sem = student.get("current_semester", 1)
                    current_year = student.get("admission_year", admission_year)
                    
                    # Check if already 4th year with semester 8 (can't promote further)
                    if current_sem >= 8:
                        errors.append(f"Student {student['_id']} already in final semester (8)")
                        continue
                    
                    new_semester = current_sem + 2
                    new_year = current_year + 1
                    
                    # Cap at semester 8
                    if new_semester > 8:
                        new_semester = 8
                    
                    db["students"].update_one(
                        {"_id": student["_id"]},
                        {
                            "$set": {
                                "current_semester": new_semester,
                                "admission_year": new_year
                            }
                        },
                        session=s
                    )
                    count += 1
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Promotion failed: {str(e)}")
    
    response_msg = f"Promoted {count} students from year {admission_year} in {college}"
    if errors:
        response_msg += f"; {len(errors)} students already in final semester"
    
    return success(response_msg, {"promoted_count": count, "errors": errors})