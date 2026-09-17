import pytest
from shapely.geometry import Polygon

from app.utils.geo import geojson_to_polygon


def test_valid_polygon():
    geometry = {
        "type": "Polygon",
        "coordinates": [
            [
                [72.80, 19.00],
                [72.81, 19.00],
                [72.81, 19.01],
                [72.80, 19.01],
                [72.80, 19.00],
            ]
        ],
    }

    polygon = geojson_to_polygon(geometry)

    assert isinstance(polygon, Polygon)
    assert polygon.is_valid


def test_invalid_geometry_type():
    geometry = {
        "type": "Point",
        "coordinates": [72.80, 19.00],
    }

    with pytest.raises(ValueError):
        geojson_to_polygon(geometry)


def test_invalid_polygon():
    geometry = {
        "type": "Polygon",
        "coordinates": [
            [
                [0, 0],
                [1, 1],
                [0, 1],
                [1, 0],
                [0, 0],
            ]
        ],
    }

    with pytest.raises(ValueError):
        geojson_to_polygon(geometry)