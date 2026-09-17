from uuid import UUID

from fastapi import HTTPException, status
from geoalchemy2.shape import from_shape, to_shape
from sqlalchemy.orm import Session

from app.repositories.site_repository import (
    calculate_area_hectares,
    create_site,
    get_sites_by_project,
)
from app.utils.geo import geojson_to_polygon, polygon_to_geojson


def serialize_site(site):
    geometry = to_shape(site.geometry)

    return {
        "id": site.id,
        "project_id": site.project_id,
        "name": site.name,
        "description": site.description,
        "geometry": polygon_to_geojson(geometry),
        "area_hectares": site.area_hectares,
    }


def create_new_site(
    db: Session,
    project_id: UUID,
    name: str,
    description: str | None,
    geometry: dict,
):
    try:
        polygon = geojson_to_polygon(geometry)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    site_geometry = from_shape(
        polygon,
        srid=4326,
    )

    area_hectares = calculate_area_hectares(
        db=db,
        geometry=site_geometry,
    )

    site = create_site(
        db=db,
        project_id=project_id,
        name=name,
        description=description,
        geometry=site_geometry,
        area_hectares=area_hectares,
    )

    return serialize_site(site)


def list_project_sites(
    db: Session,
    project_id: UUID,
):
    sites = get_sites_by_project(
        db=db,
        project_id=project_id,
    )

    return [serialize_site(site) for site in sites]