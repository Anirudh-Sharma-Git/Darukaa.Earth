from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project


def create_project(
    db: Session,
    name: str,
    description: str | None,
    user_id: UUID,
) -> Project:
    project = Project(
        name=name,
        description=description,
        created_by=user_id,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


def get_projects(
    db: Session,
    user_id: UUID,
) -> list[Project]:
    statement = (
        select(Project)
        .where(Project.created_by == user_id)
        .order_by(Project.created_at.desc())
    )

    return list(db.scalars(statement).all())


def get_project_by_id(
    db: Session,
    project_id: UUID,
    user_id: UUID,
) -> Project | None:
    statement = select(Project).where(
        Project.id == project_id,
        Project.created_by == user_id,
    )

    return db.scalar(statement)


def update_project(
    db: Session,
    project: Project,
) -> Project:
    db.commit()
    db.refresh(project)

    return project


def delete_project(
    db: Session,
    project: Project,
) -> None:
    db.delete(project)
    db.commit()