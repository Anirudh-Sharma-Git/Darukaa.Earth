from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.measurement_repository import get_measurements_by_site
from app.repositories.site_repository import get_site_by_id_for_user
from app.schemas.analytics import (
    AnalyticsDataPoint,
    AnalyticsSummary,
    SiteAnalyticsResponse,
)


def get_site_analytics(
    db: Session,
    site_id: UUID,
    user_id: UUID,
) -> SiteAnalyticsResponse:

    site = get_site_by_id_for_user(
        db=db,
        site_id=site_id,
        user_id=user_id,
    )

    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    measurements = get_measurements_by_site(
        db=db,
        site_id=site_id,
    )

    time_series = [
        AnalyticsDataPoint(
            measurement_date=measurement.measurement_date,
            carbon_stock=measurement.carbon_stock,
            carbon_sequestered=measurement.carbon_sequestered,
            biodiversity_score=measurement.biodiversity_score,
            tree_cover=measurement.tree_cover,
        )
        for measurement in measurements
    ]

    latest = measurements[-1] if measurements else None

    summary = AnalyticsSummary(
        latest_carbon_stock=latest.carbon_stock if latest else None,
        latest_carbon_sequestered=(
            latest.carbon_sequestered if latest else None
        ),
        latest_biodiversity_score=(
            latest.biodiversity_score if latest else None
        ),
        latest_tree_cover=latest.tree_cover if latest else None,
        measurement_count=len(measurements),
    )

    return SiteAnalyticsResponse(
        site_id=site.id,
        site_name=site.name,
        area_hectares=site.area_hectares,
        summary=summary,
        time_series=time_series,
    )