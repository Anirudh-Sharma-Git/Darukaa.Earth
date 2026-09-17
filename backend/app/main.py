from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.routers.auth import router as auth_router
from app.core.config import settings
from app.core.database import get_db
from app.routers.projects import router as projects_router



app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)
app.include_router(auth_router)
app.include_router(projects_router)


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