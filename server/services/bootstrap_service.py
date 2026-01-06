from fastapi import HTTPException, status
from pymongo.errors import PyMongoError
from datetime import datetime

from data.roles_repo import create_role_if_not_exists
from data.superadmin_repo import get_superadmin_by_id, create_superadmin
from data.user_roles_repo import assign_role
from data.mentor_repo import get_mentor_by_id, create_mentor
from data.batch_rule_repo import create_batch_rule, list_batch_rules
from data.mentor_assignment_repo import create_assignment, list_assignments
from security.passwords import hash_password
from config import Config
from extensions.mongo import db


def init_bootstrap():
    try:
        role_super = create_role_if_not_exists("SUPER_ADMIN")
        create_role_if_not_exists("ADMIN")
        create_role_if_not_exists("HOD")
        create_role_if_not_exists("GUARD")
        create_role_if_not_exists("STUDENT")
        role_mentor = create_role_if_not_exists("MENTOR")

        for sa in Config.SUPERADMINS:
            existing = get_superadmin_by_id(sa["_id"])
            if existing:
                continue

            create_superadmin({
                "_id": sa["_id"],
                "name": sa["name"],
                "phone": sa["phone"],
                "password_hash": hash_password(sa["password"])
            })

            assign_role(sa["_id"], role_super["_id"])

        # Seed mentors, batch rules, and assignments
        _seed_mentors(role_mentor)
        _seed_batch_rules()
        _seed_mentor_assignments()

    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bootstrap initialization failed"
        )


def _seed_mentors(role_mentor):
    """Seed sample mentors for each college"""
    mentors = [
        {
            "_id": "MENTOR_CSE_01",
            "name": "Dr. Rajesh Kumar",
            "phone": "9876543210",
            "employee_id": "EMP001",
            "department": "CSE",
            "password_hash": hash_password("Mentor@123")
        },
        {
            "_id": "MENTOR_CSE_02",
            "name": "Dr. Priya Singh",
            "phone": "9876543211",
            "employee_id": "EMP002",
            "department": "CSE",
            "password_hash": hash_password("Mentor@123")
        },
        {
            "_id": "MENTOR_ECE_01",
            "name": "Dr. Anil Reddy",
            "phone": "9876543212",
            "employee_id": "EMP003",
            "department": "ECE",
            "password_hash": hash_password("Mentor@123")
        },
        {
            "_id": "MENTOR_ECE_02",
            "name": "Dr. Kavitha Rao",
            "phone": "9876543213",
            "employee_id": "EMP004",
            "department": "ECE",
            "password_hash": hash_password("Mentor@123")
        },
    ]

    for m in mentors:
        if not get_mentor_by_id(m["_id"]):
            create_mentor(m)
            assign_role(m["_id"], role_mentor["_id"])
            print(f"✅ Seeded mentor: {m['name']}")


def _seed_batch_rules():
    """Seed batch rules for splitting sections into B1 and B2"""
    # Calculate current academic year
    now = datetime.utcnow()
    if now.month >= 6:
        academic_year = f"{now.year}-{now.year + 1}"
    else:
        academic_year = f"{now.year - 1}-{now.year}"

    rules = []
    colleges = ["KMIT", "KMEC", "NGIT"]
    courses = ["CSE", "ECE", "MECH", "CIVIL"]
    sections = ["A", "B", "C"]
    semesters = [1, 2, 3, 4, 5, 6, 7, 8]

    for college in colleges:
        for course in courses:
            for section in sections:
                for semester in semesters:
                    # B1: Roll 1-50
                    rules.append({
                        "college": college,
                        "course": course,
                        "section": section,
                        "semester": semester,
                        "academic_year": academic_year,
                        "batch_name": "B1",
                        "roll_start": 1,
                        "roll_end": 50,
                        "lateral_entry": False
                    })
                    # B2: Roll 51-99
                    rules.append({
                        "college": college,
                        "course": course,
                        "section": section,
                        "semester": semester,
                        "academic_year": academic_year,
                        "batch_name": "B2",
                        "roll_start": 51,
                        "roll_end": 99,
                        "lateral_entry": False
                    })

    existing_rules = list_batch_rules()
    if len(existing_rules) == 0:
        for rule in rules:
            create_batch_rule(rule)
        print(f"✅ Seeded {len(rules)} batch rules")


def _seed_mentor_assignments():
    """Seed initial mentor assignments for current semester"""
    # Calculate current academic year
    now = datetime.utcnow()
    if now.month >= 6:
        academic_year = f"{now.year}-{now.year + 1}"
    else:
        academic_year = f"{now.year - 1}-{now.year}"

    assignments = [
        # KMIT CSE Section A Semester 1
        {
            "mentor_id": "MENTOR_CSE_01",
            "college": "KMIT",
            "course": "CSE",
            "section": "A",
            "batch_name": "B1",
            "semester": 1,
            "academic_year": academic_year,
            "active_status": True,
            "roll_start": 1,
            "roll_end": 50
        },
        {
            "mentor_id": "MENTOR_CSE_02",
            "college": "KMIT",
            "course": "CSE",
            "section": "A",
            "batch_name": "B2",
            "semester": 1,
            "academic_year": academic_year,
            "active_status": True,
            "roll_start": 51,
            "roll_end": 99
        },
        # KMIT ECE Section A Semester 1
        {
            "mentor_id": "MENTOR_ECE_01",
            "college": "KMIT",
            "course": "ECE",
            "section": "A",
            "batch_name": "B1",
            "semester": 1,
            "academic_year": academic_year,
            "active_status": True,
            "roll_start": 1,
            "roll_end": 50
        },
        {
            "mentor_id": "MENTOR_ECE_02",
            "college": "KMIT",
            "course": "ECE",
            "section": "A",
            "batch_name": "B2",
            "semester": 1,
            "academic_year": academic_year,
            "active_status": True,
            "roll_start": 51,
            "roll_end": 99
        },
    ]

    existing_assignments = list_assignments()
    if len(existing_assignments) == 0:
        for assign in assignments:
            create_assignment(assign)
        print(f"✅ Seeded {len(assignments)} mentor assignments")
