from datetime import datetime
from bson import ObjectId
from pymongo.errors import PyMongoError
from fastapi import HTTPException, status
import base64

from core.global_response import success
from extensions.mongo import client, db

from schemas.request_schema import Request
from data.requests_repo import (
    create_request,
    get_request_by_id,
    get_requests_by_student,
    get_requests_by_hod,
    get_all_requests,
    update_request,
    delete_request_if_requested,
    auto_mark_unchecked,
    has_active_request,
    count_todays_requests,
    get_todays_approved_requests,
    get_todays_requests_for_hod,
    get_todays_requests_for_student,
    get_pending_requests_for_hod,
    get_approved_requests_for_guard_college
)

from data.student_hod_repo import get_hods_for_student
from data.student_repo import get_student_by_id
from data.faces_repo import get_face_by_user
from data.mentor_assignment_repo import get_assignments_for_student
from data.batch_rule_repo import get_batch_for_student
from data.mentor_repo import get_mentor_by_id


# ==========================================================
# INTERNAL: AUTO CLEAN (NON-CRITICAL)
# ==========================================================
def _auto_clean():
    try:
        auto_mark_unchecked()
    except Exception as e:
        print("[AUTO-CLEAN] Failed:", e)


def _parse_roll_number(raw_id: str):
    """Extract last 2 digits as roll number from student ID"""
    try:
        # Extract last 2 digits as roll number (e.g., "245522733096" -> 96)
        return int(raw_id[-2:])
    except Exception:
        return None


def _resolve_mentor(student: dict, semester: int, academic_year: str):
    roll = _parse_roll_number(student["_id"])

    batch_rule = get_batch_for_student(
        college=student["college"],
        course=student["course"],
        section=student["section"],
        semester=semester,
        academic_year=academic_year,
        roll_number=roll
    )

    if not batch_rule:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No batch rule found for student")

    assignments = get_assignments_for_student(
        college=student["college"],
        course=student["course"],
        section=student["section"],
        semester=semester,
        academic_year=academic_year,
        roll_number=roll
    )

    # pick assignment matching batch_name if provided and active
    chosen = None
    for a in assignments:
        if not a.get("active_status", True):
            continue
        if a.get("batch_name") and batch_rule.get("batch_name"):
            if a["batch_name"] == batch_rule["batch_name"]:
                chosen = a
                break
        else:
            chosen = a
            break

    if not chosen:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active mentor assignment found for student")

    mentor = get_mentor_by_id(chosen["mentor_id"])
    if not mentor:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assigned mentor not found")

    return chosen, mentor, batch_rule


def _clean_request(doc: dict):
    if not doc:
        return doc
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ==========================================================
# CREATE REQUEST
# ==========================================================
def create_new_request(student_id: str, reason: str):
    try:
        with client.start_session() as s:
            with s.start_transaction():

                _auto_clean()

                student = get_student_by_id(student_id)
                if not student:
                    raise HTTPException(404, "Student not found")

                # Derive semester and academic_year from student record
                semester = student.get("current_semester")
                if not semester:
                    raise HTTPException(400, "Student semester not set")
                
                # Calculate academic year based on current date
                now = datetime.utcnow()
                if now.month >= 6:  # June onwards = new academic year starts
                    academic_year = f"{now.year}-{now.year + 1}"
                else:
                    academic_year = f"{now.year - 1}-{now.year}"

                # ----------------------------------
                # RULE 1: Active request check
                # ----------------------------------
                if has_active_request(student_id, session=s):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="You already have an active request"
                    )

                # ----------------------------------
                # RULE 2: Max 3 requests per day
                # ----------------------------------
                today_count = count_todays_requests(student_id, session=s)
                if today_count >= 3:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Daily request limit (3) exceeded"
                    )

                assignment, mentor, batch_rule = _resolve_mentor(student, semester, academic_year)

                # Ensure there is at least one HOD responsible for this student
                hod_mappings = get_hods_for_student(student_id)
                if not hod_mappings:
                    # Fallback: dynamically resolve HOD by college/course/year
                    try:
                        # Support both new schema ('course') and legacy ('courses' array)
                            # Compute year from semester if missing (ceil(semester/2))
                            student_year = student.get("year") or ((semester + 1) // 2)
                            match_hod = db["hods"].find_one({
                                "college": student["college"],
                                "$and": [
                                    {"years": {"$in": [int(student_year)]}},
                                    {"$or": [
                                        {"course": student["course"]},
                                        {"courses": student["course"]},
                                        {"courses": {"$in": [student["course"]]}}
                                    ]}
                                ]
                            })
                    except Exception:
                        match_hod = None

                    if not match_hod:
                        raise HTTPException(404, "No HOD assigned to student")

                        # Auto-seed the mapping to prevent future failures
                        try:
                            map_student_to_hod(
                                student_id=student["_id"],
                                hod_id=match_hod["_id"],
                                year=int(student_year),
                                course=student["course"],
                                college=student["college"],
                                session=s
                            )
                        except Exception:
                            # Non-fatal: continue without mapping if auto-seed fails
                            pass
                req_doc = {
                    "student_id": student["_id"],
                    "student_name": student["name"],
                    "admission_year": student["admission_year"],
                    "current_semester": student["current_semester"],
                    "course": student["course"],
                    "section": student["section"],
                    "college": student["college"],

                    "reason": reason,
                    "request_time": datetime.utcnow(),
                    "semester": semester,
                    "academic_year": academic_year,
                    "batch_name": batch_rule.get("batch_name"),

                    # mentor stage
                    "mentor_id": mentor["_id"],
                    "mentor_name": mentor["name"],
                    "mentor_status": "PENDING",

                    # hod stage
                    "hod_id": None,
                    "hod_name": None,
                    "status": "PENDING_MENTOR"
                }

                res = create_request(req_doc)
                created = get_request_by_id(res.inserted_id)
                created = _clean_request(created)  # ✅ FIX

        return success("Request submitted", created)

    except HTTPException:
        raise
    except Exception as e:
        print("CREATE REQUEST ERROR:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create request"
        )





# ==========================================================
# APPROVE REQUEST
# ==========================================================
def approve_request(request_id, hod_id, hod_name):
    try:
        with client.start_session() as s:
            with s.start_transaction():
                
                _auto_clean()

                req = get_request_by_id(request_id)
                if not req:
                    raise HTTPException(404, "Request not found")

                if req.get("hod_id") or req.get("status") != "PENDING_HOD" or req.get("mentor_status") != "APPROVED":
                    raise HTTPException(409, "Request not ready for HOD processing")

                update_request(request_id, {
                    "status": "APPROVED",
                    "hod_id": hod_id,
                    "hod_name": hod_name,
                    "hod_action_time": datetime.utcnow(),
                    "approval_time": datetime.utcnow()
                })

                updated = get_request_by_id(request_id)
                updated = _clean_request(updated)  # ✅ FIX

        return success("Request approved", updated)

    except Exception:
        raise


# ==========================================================
# REJECT REQUEST
# ==========================================================
def reject_request(request_id, hod_id, hod_name):
    try:
        with client.start_session() as s:
            with s.start_transaction():
                
                _auto_clean()

                req = get_request_by_id(request_id)
                if not req:
                    raise HTTPException(404, "Request not found")

                if req.get("hod_id") or req.get("status") != "PENDING_HOD" or req.get("mentor_status") != "APPROVED":
                    raise HTTPException(409, "Request not ready for HOD processing")

                update_request(request_id, {
                    "status": "REJECTED",
                    "hod_id": hod_id,
                    "hod_name": hod_name,
                    "hod_action_time": datetime.utcnow(),
                    "rejection_time": datetime.utcnow()
                })

                updated = get_request_by_id(request_id)
                updated = _clean_request(updated)  # ✅ FIX

        return success("Request rejected", updated)

    except Exception:
        raise


# ==========================================================
# MENTOR DECISIONS
# ==========================================================
def mentor_approve_request(request_id: str, mentor_id: str, mentor_name: str, remark: str | None, parent_contacted: bool | None):
    try:
        with client.start_session() as s:
            with s.start_transaction():

                _auto_clean()

                req = get_request_by_id(request_id)
                if not req:
                    raise HTTPException(404, "Request not found")

                if req.get("mentor_id") != mentor_id:
                    raise HTTPException(403, "Not authorized to act on this request")

                if req.get("status") != "PENDING_MENTOR" or req.get("mentor_status") != "PENDING":
                    raise HTTPException(409, "Request already processed by mentor")

                update_request(request_id, {
                    "mentor_status": "APPROVED",
                    "mentor_remark": remark,
                    "mentor_parent_contacted": parent_contacted,
                    "mentor_action_time": datetime.utcnow(),
                    "status": "PENDING_HOD"
                })

                updated = get_request_by_id(request_id)
                updated = _clean_request(updated)

        return success("Request forwarded to HOD", updated)

    except Exception:
        raise


def mentor_reject_request(request_id: str, mentor_id: str, mentor_name: str, remark: str):
    try:
        with client.start_session() as s:
            with s.start_transaction():

                _auto_clean()

                req = get_request_by_id(request_id)
                if not req:
                    raise HTTPException(404, "Request not found")

                if req.get("mentor_id") != mentor_id:
                    raise HTTPException(403, "Not authorized to act on this request")

                if req.get("status") != "PENDING_MENTOR" or req.get("mentor_status") != "PENDING":
                    raise HTTPException(409, "Request already processed by mentor")

                update_request(request_id, {
                    "mentor_status": "REJECTED",
                    "mentor_remark": remark,
                    "mentor_action_time": datetime.utcnow(),
                    "rejection_time": datetime.utcnow(),
                    "status": "REJECTED"
                })

                updated = get_request_by_id(request_id)
                updated = _clean_request(updated)

        return success("Request rejected by mentor", updated)

    except Exception:
        raise



# ==========================================================
# MARK LEFT CAMPUS
# ==========================================================
def mark_left(request_id):
    try:
        with client.start_session() as s:
            with s.start_transaction():

                _auto_clean()

                update_request(request_id, {
                    "status": "EXIT_ALLOWED",
                    "exit_mark_time": datetime.utcnow()
                })

                updated = get_request_by_id(request_id)
                updated = _clean_request(updated)  # ✅ FIX

        return success("Student marked as left campus", updated)

    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while marking left"
        )


# ==========================================================
# READ-ONLY SERVICES
# ==========================================================
def service_get_student_requests(student_id):
    try:
        # Fetch and ensure JSON-safe response (ObjectId to str)
        docs = get_requests_by_student(student_id)

        cleaned = []
        for r in docs:
            if "_id" in r:
                r["_id"] = str(r["_id"])  # prevent ObjectId serialization errors
            cleaned.append(r)

        return success("Student requests", cleaned)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch student requests"
        )


def service_get_hod_pending_requests(hod_id: str):
    try:
        with client.start_session() as s:
            with s.start_transaction():

                # 1) Primary path: use explicit student_hod mappings
                reqs = get_pending_requests_for_hod(hod_id)

                # 2) Fallback path: dynamically match by HOD college/course/years
                #    This ensures legacy data or missing mappings don't block visibility
                hod_doc = db["hods"].find_one({"_id": hod_id})
                if hod_doc:
                    hod_courses = []
                    if hod_doc.get("course"):
                        hod_courses = [hod_doc["course"]]
                    elif hod_doc.get("courses"):
                        hod_courses = hod_doc["courses"] if isinstance(hod_doc["courses"], list) else [hod_doc["courses"]]

                    if hod_courses:
                        dynamic = list(
                            db["requests"].find({
                                "college": hod_doc.get("college"),
                                "course": {"$in": hod_courses},
                                "status": "PENDING_HOD",
                                "mentor_status": "APPROVED",
                                "hod_id": None
                            }).sort("request_time", -1)
                        )

                        # Filter by managed years using semester->year mapping
                        years_set = set(int(y) for y in (hod_doc.get("years") or []))
                        filtered_dynamic = []
                        for r in dynamic:
                            sem = r.get("semester")
                            year_from_sem = None
                            try:
                                if isinstance(sem, int):
                                    year_from_sem = (sem + 1) // 2
                            except Exception:
                                year_from_sem = None
                            if not years_set or (year_from_sem and year_from_sem in years_set):
                                filtered_dynamic.append(r)

                        # Merge avoiding duplicates
                        existing_ids = {str(x.get("_id")) for x in reqs}
                        for r in filtered_dynamic:
                            if str(r.get("_id")) not in existing_ids:
                                reqs.append(r)

                # 3) Enrich and clean response
                cleaned = []
                for r in reqs:
                    if "_id" in r:
                        r["_id"] = str(r["_id"])

                    face_doc = get_face_by_user(r["student_id"]) 
                    r["student_face"] = (
                        base64.b64encode(face_doc["image_data"]).decode()
                        if face_doc else None
                    ) 

                    cleaned.append(r)

        return success("Pending requests", cleaned)

    except Exception as e:
        print("HOD PENDING ERROR:", e)
        raise


def service_get_hod_requests(hod_id):
    try:
        return success("HOD requests", get_requests_by_hod(hod_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch HOD requests"
        )


def service_get_mentor_requests(mentor_id: str):
    try:
        reqs = list(
            db["requests"].find({
                "mentor_id": mentor_id,
                "status": "PENDING_MENTOR"
            }).sort("request_time", -1)
        )

        cleaned = []
        for r in reqs:
            if "_id" in r:
                r["_id"] = str(r["_id"])
            face_doc = get_face_by_user(r["student_id"]) 
            r["student_face"] = (
                base64.b64encode(face_doc["image_data"]).decode()
                if face_doc else None
            ) 
            cleaned.append(r)

        return success("Mentor requests", cleaned)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch mentor requests"
        )


def service_get_all_requests():
    try:
        return success("All requests", get_all_requests())
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch all requests"
        )


def service_get_todays_approved():
    try:
        return success("Today approved", get_todays_approved_requests())
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch today's approvals"
        )


# ==========================================================
# TODAY'S HOD REQUESTS (ENRICHED)
# ==========================================================
def service_get_hod_todays_requests(hod_id):
    try:
        _auto_clean()

        reqs = get_todays_requests_for_hod(hod_id)
        enriched = []

        for r in reqs:
            stu = get_student_by_id(r["student_id"])
            if not stu:
                continue

            face_doc = get_face_by_user(r["student_id"])
            face_b64 = None
            if face_doc:
                face_b64 = base64.b64encode(face_doc["image_data"]).decode()

            enriched.append({
                "request_id": str(r["_id"]),
                "student_id": r["student_id"],
                "student_name": r["student_name"],
                "year": r["year"],
                "course": r["course"],
                "section": r["section"],
                "reason": r["reason"],
                "status": r["status"],
                "student_face": face_b64,
                "student_phone": stu["phone"],
                "college": stu["college"],
                "request_time": str(r["request_time"])
            })

        return success("Today's HOD requests", enriched)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch today's HOD requests"
        )


# ==========================================================
# TODAY'S STUDENT REQUESTS
# ==========================================================
def service_get_student_todays_requests(student_id):
    try:
        todays = get_todays_requests_for_student(student_id)

        enriched = []
        for r in todays:
            enriched.append({
                "request_id": str(r["_id"]),
                "reason": r["reason"],
                "status": r["status"],
                "request_time": str(r.get("request_time")),
                "mentor_status": r.get("mentor_status"),
                "mentor_remark": r.get("mentor_remark"),
                "mentor_action_time": str(r.get("mentor_action_time")),
                "hod_id": r.get("hod_id"),
                "hod_name": r.get("hod_name"),
                "hod_action_time": str(r.get("hod_action_time")),
                "exit_mark_time": str(r.get("exit_mark_time"))
            })

        return success("Today's student requests", enriched)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch today's student requests"
        )

def service_get_request_by_id(request_id: str):
    req = get_request_by_id(request_id)
    if not req:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    return success("Request fetched", _clean_request(req))


def service_get_guard_approved_requests(guard_college: str):
    try:
        reqs = get_approved_requests_for_guard_college(guard_college)

        cleaned = []
        for r in reqs:
            if "_id" in r:
                r["_id"] = str(r["_id"])   # ✅ CRITICAL FIX

            face_doc = get_face_by_user(r["student_id"])
            face_b64 = None
            if face_doc:
                face_b64 = base64.b64encode(face_doc["image_data"]).decode()

            r["student_face"] = face_b64
            cleaned.append(r)

        return success("Approved requests for guard", cleaned)

    except Exception as e:
        print("GUARD APPROVED ERROR:", e)  # 👈 helps debugging
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch guard approved requests"
        )

def service_delete_requested_request(request_id: str, student_id: str):
    """
    Allows a student to delete ONLY their REQUESTED request.
    """
    try:
        with client.start_session() as s:
            with s.start_transaction():

                req = get_request_by_id(request_id)
                if not req:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Request not found"
                    )

                # 🔐 Ownership check
                if req["student_id"] != student_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You cannot delete someone else's request"
                    )

                # ❌ Only REQUESTED allowed
                if req["status"] != "PENDING_MENTOR":
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Only mentor-pending requests can be deleted"
                    )

                result = delete_request_if_requested(request_id, session=s)

                if result.deleted_count == 0:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Request could not be deleted"
                    )

        return success("Request deleted successfully")

    except HTTPException:
        raise
    except Exception as e:
        print("DELETE REQUEST ERROR:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete request"
        )