from uuid import UUID

from geoalchemy2 import functions as geo_func
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.site import Site


def create_site(
    db: Session,
    project_id: UUID,
    name: str,
    description: str | None,
    geometry,
    area_hectares: float,
) -> Site:
    site = Site(
        project_id=project_id,
        name=name,
        description=description,
        geometry=geometry,
        area_hectares=area_hectares,
    )

    db.add(site)
    db.commit()
    db.refresh(site)

    return site


def get_sites_by_project(
    db: Session,
    project_id: UUID,
) -> list[Site]:
    statement = (
        select(Site)
        .where(Site.project_id == project_id)
        .order_by(Site.created_at.desc())
    )

    return list(db.scalars(statement).all())


def get_site_by_id(
    db: Session,
    site_id: UUID,
    project_id: UUID,
) -> Site | None:
    statement = select(Site).where(
        Site.id == site_id,
        Site.project_id == project_id,
    )

    return db.scalar(statement)


def calculate_area_hectares(
    db: Session,
    geometry,
) -> float:
    statement = select(
        geo_func.ST_Area(
            geo_func.ST_Transform(
                geometry,
                6933,
            )
        )
    )

    area_m2 = db.scalar(statement)

    return float(area_m2) / 10_000

def update_site(
    db: Session,
    site: Site,
) -> Site:
    db.commit()
    db.refresh(site)

    return site


def delete_site(
    db: Session,
    site: Site,
) -> None:
    db.delete(site)
    db.commit()