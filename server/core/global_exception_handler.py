from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_500_INTERNAL_SERVER_ERROR

FRONTEND_ORIGIN = "http://localhost:5173"

def cors_headers():
    return {
        "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
        "Access-Control-Allow-Credentials": "true"
    }

def init_exception_handlers(app):

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=HTTP_400_BAD_REQUEST,
            headers=cors_headers(),
            content={
                "success": False,
                "statusCode": HTTP_400_BAD_REQUEST,
                "message": "Invalid request data",
                "errors": exc.errors()
            }
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            headers=cors_headers(),
            content={
                "success": False,
                "statusCode": exc.status_code,
                "message": exc.detail
            }
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            headers=cors_headers(),
            content={
                "success": False,
                "statusCode": HTTP_500_INTERNAL_SERVER_ERROR,
                "message": "Internal Server Error"
            }
        )
