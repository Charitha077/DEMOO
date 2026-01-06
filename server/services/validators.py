from fastapi import HTTPException, status

ALLOWED_COLLEGES = {"KMIT", "KMEC", "NGIT"}

def validate_college(college: str):
    if college not in ALLOWED_COLLEGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid college: {college}"
        )
