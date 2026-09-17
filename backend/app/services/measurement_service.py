from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.measurement_repository import (
    create_measurement,
    get_measurements_by_site,
)


def add_measurement(
    db: Session,
    site_id: UUID,
    data: dict,
):
    return create_measurement(
        db=db,
        site_id=site_id,
        **data,
    )


def list_site_measurements(
    db: Session,
    site_id: UUID,
):
    return get_measurements_by_site(
        db=db,
        site_id=site_id,
    )