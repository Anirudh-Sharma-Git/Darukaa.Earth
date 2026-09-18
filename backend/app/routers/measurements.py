from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.measurement import (
    MeasurementCreate,
    MeasurementResponse,
)
from app.services.measurement_service import (
    add_measurement,
    list_site_measurements,
)
from app.services.project_service import get_user_project
from app.services.site_service import get_project_site

router = APIRouter(
    prefix="/api/v1/projects/{project_id}/sites/{site_id}/measurements",
    tags=["Measurements"],
)


def verify_site_access(
    db: Session,
    project_id: UUID,
    site_id: UUID,
    user_id: UUID,
):
    get_user_project(
        db=db,
        project_id=project_id,
        user_id=user_id,
    )

    return get_project_site(
        db=db,
        site_id=site_id,
        project_id=project_id,
    )


@router.post(
    "",
    response_model=MeasurementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_measurement_endpoint(
    project_id: UUID,
    site_id: UUID,
    data: MeasurementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_site_access(
        db=db,
        project_id=project_id,
        site_id=site_id,
        user_id=current_user.id,
    )

    return add_measurement(
        db=db,
        site_id=site_id,
        data=data.model_dump(),
    )


@router.get(
    "",
    response_model=list[MeasurementResponse],
)
def get_measurements(
    project_id: UUID,
    site_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_site_access(
        db=db,
        project_id=project_id,
        site_id=site_id,
        user_id=current_user.id,
    )

    return list_site_measurements(
        db=db,
        site_id=site_id,
    )
