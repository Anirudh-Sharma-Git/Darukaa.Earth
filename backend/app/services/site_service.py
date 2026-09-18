from uuid import UUID

from fastapi import HTTPException, status
from geoalchemy2.shape import from_shape, to_shape
from sqlalchemy.orm import Session

from app.repositories.site_repository import (
    calculate_area_hectares,
    create_site,
    delete_site,
    get_site_by_id,
    get_sites_by_project,
    update_site,
)
from app.utils.geo import geojson_to_polygon, polygon_to_geojson


def serialize_site(site):
    return {
        "id": site.id,
        "project_id": site.project_id,
        "name": site.name,
        "description": site.description,
        "geometry": polygon_to_geojson(to_shape(site.geometry)),
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


def get_project_site(
    db: Session,
    site_id: UUID,
    project_id: UUID,
):
    site = get_site_by_id(
        db=db,
        site_id=site_id,
        project_id=project_id,
    )

    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    return serialize_site(site)


def update_project_site(
    db: Session,
    site_id: UUID,
    project_id: UUID,
    name: str | None,
    description: str | None,
    geometry: dict | None,
):
    site = get_site_by_id(
        db=db,
        site_id=site_id,
        project_id=project_id,
    )

    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    if name is not None:
        site.name = name

    if description is not None:
        site.description = description

    if geometry is not None:
        try:
            polygon = geojson_to_polygon(geometry)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            )

        site.geometry = from_shape(
            polygon,
            srid=4326,
        )

        site.area_hectares = calculate_area_hectares(
            db=db,
            geometry=site.geometry,
        )

    site = update_site(db, site)

    return serialize_site(site)


def delete_project_site(
    db: Session,
    site_id: UUID,
    project_id: UUID,
):
    site = get_site_by_id(
        db=db,
        site_id=site_id,
        project_id=project_id,
    )

    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    delete_site(db, site)
