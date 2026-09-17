from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.site import (
    SiteCreate,
    SiteResponse,
    SiteUpdate,
)
from app.services.project_service import get_user_project
from app.services.site_service import (
    create_new_site,
    delete_project_site,
    get_project_site,
    list_project_sites,
    update_project_site,
)


router = APIRouter(
    prefix="/api/v1/projects/{project_id}/sites",
    tags=["Sites"],
)


@router.post(
    "",
    response_model=SiteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_site_endpoint(
    project_id: UUID,
    data: SiteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_project(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
    )

    return create_new_site(
        db=db,
        project_id=project_id,
        name=data.name,
        description=data.description,
        geometry=data.geometry.model_dump(),
    )


@router.get(
    "",
    response_model=list[SiteResponse],
)
def get_sites(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_project(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
    )

    return list_project_sites(
        db=db,
        project_id=project_id,
    )


@router.get(
    "/{site_id}",
    response_model=SiteResponse,
)
def get_site(
    project_id: UUID,
    site_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_project(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
    )

    return get_project_site(
        db=db,
        site_id=site_id,
        project_id=project_id,
    )


@router.patch(
    "/{site_id}",
    response_model=SiteResponse,
)
def update_site(
    project_id: UUID,
    site_id: UUID,
    data: SiteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_project(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
    )

    return update_project_site(
        db=db,
        site_id=site_id,
        project_id=project_id,
        name=data.name,
        description=data.description,
        geometry=(
            data.geometry.model_dump()
            if data.geometry
            else None
        ),
    )


@router.delete(
    "/{site_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_site(
    project_id: UUID,
    site_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_user_project(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
    )

    delete_project_site(
        db=db,
        site_id=site_id,
        project_id=project_id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)