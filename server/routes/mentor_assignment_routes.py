from fastapi import APIRouter, Depends
from security.dependencies import require_roles
from schemas.api_request_models import MentorAssignmentCreateRequest, BatchRuleCreateRequest
from services.mentor_assignment_service import (
    create_batch_rule_service,
    list_batch_rules_service,
    delete_batch_rule_service,
    create_assignment_service,
    list_assignments_service,
    reset_assignments_for_semester
)

router = APIRouter(prefix="/mentor-assignment", tags=["Mentor Assignment"])


@router.post("/batch-rule")
def create_batch_rule(payload: BatchRuleCreateRequest, _=Depends(require_roles("SUPER_ADMIN", "ADMIN", "HOD"))):
    return create_batch_rule_service(payload.dict())


@router.get("/batch-rule")
def list_batch_rules(_=Depends(require_roles("SUPER_ADMIN", "ADMIN", "HOD"))):
    return list_batch_rules_service()


@router.delete("/batch-rule/{rule_id}")
def delete_batch_rule(rule_id: str, _=Depends(require_roles("SUPER_ADMIN", "ADMIN", "HOD"))):
    return delete_batch_rule_service(rule_id)


@router.post("/assign")
def create_assignment(payload: MentorAssignmentCreateRequest, _=Depends(require_roles("SUPER_ADMIN", "ADMIN", "HOD"))):
    return create_assignment_service(payload.dict())


@router.get("/assign")
def list_assignments(_=Depends(require_roles("SUPER_ADMIN", "ADMIN", "HOD"))):
    return list_assignments_service()


@router.post("/assign/reset")
def reset_assignments(college: str, academic_year: str, semester: int, _=Depends(require_roles("SUPER_ADMIN", "ADMIN", "HOD"))):
    return reset_assignments_for_semester(college, academic_year, semester)
