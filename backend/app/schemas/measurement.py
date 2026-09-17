from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MeasurementCreate(BaseModel):
    measurement_date: date
    carbon_stock: float | None = Field(default=None, ge=0)
    carbon_sequestered: float | None = Field(default=None, ge=0)
    biodiversity_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    tree_cover: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )


class MeasurementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    site_id: UUID
    measurement_date: date
    carbon_stock: float | None
    carbon_sequestered: float | None
    biodiversity_score: float | None
    tree_cover: float | None