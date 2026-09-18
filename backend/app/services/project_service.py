from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.project_repository import (
    create_project,
    delete_project,
    get_project_by_id,
    get_projects,
    update_project,
)


def create_new_project(
    db: Session,
    user_id: UUID,
    name: str,
    description: str | None,
) -> Project:
    return create_project(
        db=db,
        name=name,
        description=description,
        user_id=user_id,
    )


def list_user_projects(
    db: Session,
    user_id: UUID,
) -> list[Project]:
    return get_projects(db, user_id)


def get_user_project(
    db: Session,
    project_id: UUID,
    user_id: UUID,
) -> Project:
    project = get_project_by_id(
        db=db,
        project_id=project_id,
        user_id=user_id,
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


def update_user_project(
    db: Session,
    project_id: UUID,
    user_id: UUID,
    name: str | None,
    description: str | None,
    project_status,
) -> Project:
    project = get_user_project(
        db=db,
        project_id=project_id,
        user_id=user_id,
    )

    if name is not None:
        project.name = name

    if description is not None:
        project.description = description

    if project_status is not None:
        project.status = project_status

    return update_project(db, project)


def delete_user_project(
    db: Session,
    project_id: UUID,
    user_id: UUID,
) -> None:
    project = get_user_project(
        db=db,
        project_id=project_id,
        user_id=user_id,
    )

    delete_project(db, project)
