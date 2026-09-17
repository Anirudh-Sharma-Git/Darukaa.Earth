from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class GeoJSONPolygon(BaseModel):
    type: str
    coordinates: list[list[list[float]]]


class SiteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    geometry: GeoJSONPolygon


class SiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    description: str | None
    geometry: dict
    area_hectares: float