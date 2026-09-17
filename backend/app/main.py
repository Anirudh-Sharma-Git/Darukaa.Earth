from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.routers.auth import router as auth_router
from app.core.config import settings
from app.core.database import get_db
from app.routers.projects import router as projects_router
from app.routers.sites import router as sites_router
from app.routers.measurements import router as measurements_router
from app.routers.analytics import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware
from app.core.exceptions import global_exception_handler
from app.core.logging import configure_logging


configure_logging()
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(sites_router)
app.include_router(measurements_router)
app.include_router(analytics_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_exception_handler(
    Exception,
    global_exception_handler,
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
    }


@app.get("/health/db")
def database_health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))

    return {
        "database": "ok",
        "result": result.scalar(),
    }

@app.get("/health/ready")
def readiness_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "status": "ready",
        "database": "ok",
    }