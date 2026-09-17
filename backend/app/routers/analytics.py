from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.analytics import SiteAnalyticsResponse
from app.services.analytics_service import get_site_analytics


router = APIRouter(
    prefix="/api/v1/sites",
    tags=["Analytics"],
)


@router.get(
    "/{site_id}/analytics",
    response_model=SiteAnalyticsResponse,
)
def get_site_analytics_endpoint(
    site_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_site_analytics(
        db=db,
        site_id=site_id,
        user_id=current_user.id,
    )