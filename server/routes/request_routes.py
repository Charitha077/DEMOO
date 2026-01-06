# routes/request_routes.py
from fastapi import APIRouter, Depends,HTTPException, status
from services.request_service import (
    create_new_request, approve_request, reject_request,service_get_hod_pending_requests,service_delete_requested_request,
    mark_left, service_get_student_requests, service_get_hod_requests,service_get_guard_approved_requests,
    service_get_all_requests, service_get_todays_approved,service_get_hod_todays_requests,service_get_request_by_id,
    mentor_approve_request, mentor_reject_request, service_get_mentor_requests
)
from security.dependencies import require_roles
from schemas.api_request_models import (
    RequestCreate, ApproveRequestBody, RejectRequestBody,
    MentorApproveRequestBody, MentorRejectRequestBody
)

router = APIRouter(prefix="/request", tags=["Requests"])


@router.post("/create")
def create_request(payload: RequestCreate, _=Depends(require_roles("STUDENT"))):
    return create_new_request(payload.student_id, payload.reason)


@router.get("/mentor/pending")
def mentor_pending(user_id=Depends(require_roles("MENTOR"))):
    return service_get_mentor_requests(user_id)


@router.post("/{req_id}/mentor/approve")
def mentor_approve(req_id: str, payload: MentorApproveRequestBody, user_id=Depends(require_roles("MENTOR"))):
    if payload.mentor_id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Mismatched mentor context")
    return mentor_approve_request(req_id, payload.mentor_id, payload.mentor_name, payload.remark, payload.parent_contacted)


@router.post("/{req_id}/mentor/reject")
def mentor_reject(req_id: str, payload: MentorRejectRequestBody, user_id=Depends(require_roles("MENTOR"))):
    if payload.mentor_id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Mismatched mentor context")
    return mentor_reject_request(req_id, payload.mentor_id, payload.mentor_name, payload.remark)


@router.post("/{req_id}/approve")
def approve(req_id: str, payload: ApproveRequestBody, _=Depends(require_roles("HOD"))):
    return approve_request(req_id, payload.hod_id, payload.hod_name)


@router.post("/{req_id}/reject")
def reject(req_id: str, payload: RejectRequestBody, _=Depends(require_roles("HOD"))):
    return reject_request(req_id, payload.hod_id, payload.hod_name)


@router.post("/{req_id}/left")
def left(req_id: str, _=Depends(require_roles("GUARD"))):
    return mark_left(req_id)


@router.get("/student/{student_id}")
def student_reqs(student_id: str, _=Depends(require_roles("STUDENT"))):
    return service_get_student_requests(student_id)


@router.get("/hod/{hod_id}")
def hod_reqs(hod_id: str, _=Depends(require_roles("HOD"))):
    return service_get_hod_requests(hod_id)


@router.get("/all")
def all_requests(_=Depends(require_roles("ADMIN"))):
    return service_get_all_requests()


@router.get("/approved/today")
def today(_=Depends(require_roles("ADMIN"))):
    return service_get_todays_approved()


@router.get("/requests/today/{hod_id}")
def get_today_hod_requests(
    hod_id: str,
    _=Depends(require_roles("HOD"))
):
    return service_get_hod_todays_requests(hod_id)

@router.get("/student/today/{student_id}")
def student_todays_reqs(student_id: str, _=Depends(require_roles("STUDENT"))):
    from services.request_service import service_get_student_todays_requests
    return service_get_student_todays_requests(student_id)

@router.get("/{request_id}")
def get_request(
    request_id: str,
    user_id=Depends(require_roles("ADMIN", "SUPER_ADMIN", "HOD", "STUDENT"))
):
    req = service_get_request_by_id(request_id)

    if "STUDENT" in user_id and req["student_id"] != user_id:
        raise HTTPException(403, "Access denied")

    return req

@router.get("/hod/pending/{hod_id}")
def hod_pending_requests(
    hod_id: str,
    _=Depends(require_roles("HOD"))
):
    return service_get_hod_pending_requests(hod_id)

@router.get("/guard/approved/{college}")
def guard_approved_requests(
    college: str,
    _=Depends(require_roles("GUARD"))
):
    return service_get_guard_approved_requests(college)


@router.delete("/{req_id}")
def delete_requested_request(
    req_id: str,
    student_id=Depends(require_roles("STUDENT"))
):
    return service_delete_requested_request(req_id, student_id)