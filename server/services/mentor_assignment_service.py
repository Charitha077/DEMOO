from fastapi import HTTPException, status
from pymongo.errors import PyMongoError

from core.global_response import success
from extensions.mongo import client, db

from data.batch_rule_repo import create_batch_rule, list_batch_rules, delete_batch_rule, get_batch_for_student
from data.mentor_assignment_repo import create_assignment, list_assignments, delete_assignments_for_semester
from data.mentor_repo import get_mentor_by_id


def create_batch_rule_service(payload: dict):
    try:
        res = create_batch_rule(payload)
        return success("Batch rule created", {"rule_id": str(res.inserted_id)})
    except PyMongoError:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create batch rule")


def list_batch_rules_service(filters: dict | None = None):
    rules = list_batch_rules(filters or {})
    # Convert ObjectId to string for JSON serialization
    for rule in rules:
        if "_id" in rule:
            rule["_id"] = str(rule["_id"])
    return success("Batch rules", rules)


def delete_batch_rule_service(rule_id: str):
    deleted = delete_batch_rule(rule_id)
    if deleted and deleted.deleted_count:
        return success("Batch rule deleted")
    raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Batch rule not found")


def create_assignment_service(payload: dict):
    mentor = get_mentor_by_id(payload["mentor_id"])
    if not mentor:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Mentor not found")

    # Validate max 2 mentors per section per semester
    existing_count = db["mentor_assignments"].count_documents({
        "college": payload["college"],
        "course": payload["course"],
        "section": payload["section"],
        "semester": payload["semester"],
        "academic_year": payload["academic_year"],
        "active_status": True
    })
    
    if existing_count >= 2:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Maximum 2 mentors allowed per section per semester"
        )

    try:
        res = create_assignment(payload)
        return success("Mentor assignment created", {"assignment_id": str(res.inserted_id)})
    except PyMongoError:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create mentor assignment")


def list_assignments_service(filters: dict | None = None):
    assignments = list_assignments(filters or {})
    # Convert ObjectId to string for JSON serialization
    for assignment in assignments:
        if "_id" in assignment:
            assignment["_id"] = str(assignment["_id"])
    return success("Mentor assignments", assignments)


def reset_assignments_for_semester(college: str, academic_year: str, semester: int):
    try:
        with client.start_session() as s:
            with s.start_transaction():
                delete_assignments_for_semester(college, academic_year, semester, session=s)
        return success("Assignments reset for semester")
    except PyMongoError:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to reset assignments")
