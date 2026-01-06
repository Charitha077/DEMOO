from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import socket

from extensions.cors import init_cors
from services.bootstrap_service import init_bootstrap
from core.global_response import error
from core.global_exception_handler import init_exception_handlers

# Routers
from routes.auth_routes import router as auth_router
from routes.admin_routes import router as admin_router
from routes.face_routes import router as face_router
from routes.student_routes import router as student_router
from routes.hod_routes import router as hod_router
from routes.guard_routes import router as guard_router
from routes.request_routes import router as request_router
from routes.mentor_routes import router as mentor_router
from routes.mentor_assignment_routes import router as mentor_assignment_router

app = FastAPI(title="FaceAuth System", version="2.0")



# ---------------------------------------------------------
#  CORS + STATIC
# ---------------------------------------------------------
init_cors(app)
init_exception_handlers(app)

app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------------------------------------------------
#  ROUTES
# ---------------------------------------------------------

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(face_router)
app.include_router(student_router)
app.include_router(hod_router)
app.include_router(guard_router)
app.include_router(request_router)
app.include_router(mentor_router)
app.include_router(mentor_assignment_router)
app.include_router(admin_router, prefix="/super_admin") # Handles /super_admin/...


# ---------------------------------------------------------
#  STARTUP WITH SERVER URL PRINT
# ---------------------------------------------------------
@app.on_event("startup")
async def on_start():
    init_bootstrap()

    # Detect machine IP (LAN)
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    print("\n" + "="*60)
    print("🚀 FASTAPI SERVER STARTED SUCCESSFULLY")
    print(f"🔹 Local Address:     http://127.0.0.1:5000")
    print(f"🔹 LAN Address:       http://{local_ip}:5000")
    print(f"🔹 API Docs (Swagger): http://{local_ip}:5000/docs")
    print(f"🔹 ReDoc Docs:         http://{local_ip}:5000/redoc")
    print(f"🔹 Static Files:       http://{local_ip}:5000/static")
    print("="*60 + "\n")


@app.get("/")
def home():
    return {"message": "Server running"}
