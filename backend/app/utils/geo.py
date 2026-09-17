from shapely.geometry import Polygon, mapping, shape
from shapely.validation import explain_validity


def geojson_to_polygon(geometry: dict) -> Polygon:
    if geometry.get("type") != "Polygon":
        raise ValueError("Geometry must be a Polygon")

    polygon = shape(geometry)

    if polygon.is_empty:
        raise ValueError("Geometry cannot be empty")

    if not polygon.is_valid:
        raise ValueError(
            f"Invalid polygon: {explain_validity(polygon)}"
        )

    return polygon


def polygon_to_geojson(polygon) -> dict:
    return mapping(polygon)