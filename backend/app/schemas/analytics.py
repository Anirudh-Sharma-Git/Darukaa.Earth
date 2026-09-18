from datetime import date
from uuid import UUID

from pydantic import BaseModel


class AnalyticsDataPoint(BaseModel):
    measurement_date: date
    carbon_stock: float | None
    carbon_sequestered: float | None
    biodiversity_score: float | None
    tree_cover: float | None


class AnalyticsSummary(BaseModel):
    latest_carbon_stock: float | None
    latest_carbon_sequestered: float | None
    latest_biodiversity_score: float | None
    latest_tree_cover: float | None
    measurement_count: int


class SiteAnalyticsResponse(BaseModel):
    site_id: UUID
    project_id: UUID
    site_name: str
    area_hectares: float
    summary: AnalyticsSummary
    time_series: list[AnalyticsDataPoint]
