from datetime import datetime
from pymongo.errors import PyMongoError
from fastapi import HTTPException, status

from security.passwords import hash_password
from schemas.hod_schema import HOD as HODSchema

# We import it and alias it to 'repo_get_hod' to be 100% safe
from data.hod_repo import (
    get_hod_by_id as repo_get_hod,
    get_all_hods as repo_get_all,
    update_hod as repo_update_hod,
    delete_hod as repo_delete_hod,
    filter_hods as filter_hods_repo
)

from data.student_repo import get_all_students
from data.student_hod_repo import (
    map_student_to_hod,
    delete_hod_mappings
)

from data.roles_repo import get_role_by_name
from data.faces_repo import get_face_by_user, delete_face
from data.face_vectors_repo import delete_vector

from extensions.mongo import client, db
from services.validators import validate_college
from core.global_response import success

# ==========================================================
# REGISTER HOD
# ==========================================================
def register_hod(hod_id, name, phone, years, college, course, password):
    validate_college(college)

    if repo_get_hod(hod_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"HOD with ID {hod_id} is already registered"
        )
    
    hod_doc = HODSchema(
        _id=hod_id,
        name=name,
        phone=phone,
        years=years,
        college=college,
        course=course,
        password_hash=hash_password(password)
    ).model_dump(by_alias=True)

    try:
        with client.start_session() as s:
            with s.start_transaction():
                db["hods"].insert_one(hod_doc, session=s)
                role_data = get_role_by_name("HOD")
                db["user_roles"].insert_one({
                    "user_id": hod_id,
                    "role_id": role_data["_id"],
                    "assigned_at": datetime.utcnow()
                }, session=s)
                students = db["students"].find({"college": hod_doc["college"]},session=s)

                for st in students:
                    if (
                        st.get("year") in hod_doc["years"]
                        and st["course"] == hod_doc["course"]
                    ):
                        map_student_to_hod(
                            st["_id"],
                            hod_doc["_id"],
                            st.get("year", 1),
                            st["course"],
                            st["college"],
                            session=s
                        )

    except PyMongoError:
        raise HTTPException(status_code=500, detail="HOD registration failed")

    return success("HOD registered successfully", {"hod_id": hod_id})

# ==========================================================
# GET HOD BY ID (The one the Route calls)
# ==========================================================
def service_get_hod_by_id(hod_id: str):
    # Call the REPO directly
    hod = repo_get_hod(hod_id)
    if not hod:
        raise HTTPException(status_code=404, detail="HOD not found")
    
    hod.pop("password_hash", None)
    
    # Handle legacy 'courses' (array) vs new 'course' (string) field
    # Normalize to single 'course' field for frontend consistency
    if "courses" in hod and "course" not in hod:
        # Old schema: take first course from array
        courses_val = hod.pop("courses")
        if isinstance(courses_val, list) and len(courses_val) > 0:
            hod["course"] = courses_val[0]
        else:
            hod["course"] = courses_val if courses_val else "Not Set"
    
    return success("HOD profile fetched", hod)

# ==========================================================
# UPDATE HOD
# ==========================================================
def update_hod_service(hod_id, updates):
    hod = repo_get_hod(hod_id)
    if not hod:
        raise HTTPException(status_code=404, detail="HOD not found")

    # Fields that affect student–HOD mapping
    sensitive_fields = {"years", "courses", "college"}
    needs_remap = any(f in updates for f in sensitive_fields)

    # Password handling
    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))

    # Ensure years are int
    if "years" in updates and updates["years"] is not None:
        updates["years"] = [int(y) for y in updates["years"]]

    try:
        with client.start_session() as s:
            with s.start_transaction():

                # 1️⃣ Update HOD
                repo_update_hod(hod_id, updates, session=s)

                # 2️⃣ Remap students if required
                if needs_remap:
                    # Remove old mappings
                    delete_hod_mappings(hod_id, session=s)

                    # Reload updated HOD
                    updated_hod = repo_get_hod(hod_id)

                    # Recreate mappings
                    students = get_all_students()
                    for stu in students:
                        if (
                            stu["college"] == updated_hod["college"]
                            and stu["year"] in updated_hod["years"]
                            and stu["course"] in updated_hod["courses"]
                        ):
                            map_student_to_hod(
                                stu["_id"],
                                hod_id,
                                stu["year"],
                                stu["course"],
                                stu["college"],
                                session=s
                            )

    except PyMongoError:
        raise HTTPException(status_code=500, detail="HOD update failed")

    final = repo_get_hod(hod_id)
    final.pop("password_hash", None)
    return success("HOD updated successfully", final)


# ==========================================================
# DELETE HOD
# ==========================================================
def delete_hod_service(hod_id):
    old = get_face_by_user(hod_id)
    vec = old.get("vector_ref") if old else None
    face_id = old.get("_id") if old else None

    try:
        with client.start_session() as s:
           with s.start_transaction():
            if vec: delete_vector(vec, session=s)
            if face_id: delete_face(face_id, session=s)

            repo_delete_hod(hod_id, session=s)
            delete_hod_mappings(hod_id, session=s)
            db["user_roles"].delete_many({"user_id": hod_id}, session=s)

    except PyMongoError:
        raise HTTPException(status_code=500, detail="Failed to delete HOD")

    delete_hod_mappings(hod_id)
    return success("HOD deleted successfully")

# ==========================================================
# OTHER SERVICES
# ==========================================================
def service_get_all_hods():
    hods = repo_get_all()
    # Normalize all HODs to use 'course' field
    for hod in hods:
        hod.pop("password_hash", None)
        if "courses" in hod and "course" not in hod:
            courses_val = hod.pop("courses")
            if isinstance(courses_val, list) and len(courses_val) > 0:
                hod["course"] = courses_val[0]
            else:
                hod["course"] = courses_val if courses_val else "Not Set"
    return success("All HODs", hods)

def filter_hods_service(filters: dict):
    return success("Filtered HODs", filter_hods_repo(filters))

def service_get_hods_for_student(student_id):
    from data.student_hod_repo import get_hods_for_student
    return success("HOD list for student", get_hods_for_student(student_id))

