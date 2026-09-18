from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.measurement import SiteMeasurement


def create_measurement(
    db: Session,
    site_id: UUID,
    **data,
) -> SiteMeasurement:
    measurement = SiteMeasurement(
        site_id=site_id,
        **data,
    )

    db.add(measurement)
    db.commit()
    db.refresh(measurement)

    return measurement


def get_measurements_by_site(
    db: Session,
    site_id: UUID,
) -> list[SiteMeasurement]:
    statement = (
        select(SiteMeasurement)
        .where(SiteMeasurement.site_id == site_id)
        .order_by(SiteMeasurement.measurement_date.asc())
    )

    return list(db.scalars(statement).all())
