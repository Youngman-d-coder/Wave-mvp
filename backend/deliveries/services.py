import math
from decimal import Decimal, ROUND_HALF_UP

PACKAGE_MAX_WEIGHTS = {
    "document": Decimal("2.0"),
    "small_package": Decimal("5.0"),
    "medium_package": Decimal("15.0"),
    "large_package": Decimal("50.0"),
    "fragile": Decimal("10.0"),
}

BASE_FARE = Decimal("500.00")
PER_KM_RATE = Decimal("150.00")
PER_KG_RATE = Decimal("50.00")
MIN_DISTANCE_KM = 0.5


def haversine_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance between two WGS84 points in kilometres."""
    earth_radius_km = 6371.0088
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return earth_radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def calculate_fare(lat1: float, lng1: float, lat2: float, lng2: float, weight: Decimal):
    distance = max(haversine_distance_km(lat1, lng1, lat2, lng2), MIN_DISTANCE_KM)
    distance_decimal = Decimal(str(distance))
    distance_charge = (distance_decimal * PER_KM_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    weight_charge = (max(weight - Decimal("1.0"), Decimal("0")) * PER_KG_RATE).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    total = (BASE_FARE + distance_charge + weight_charge).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "base_fare": BASE_FARE,
        "distance_charge": distance_charge,
        "weight_charge": weight_charge,
        "surge_multiplier": Decimal("1.00"),
        "promo_discount": Decimal("0.00"),
        "total": total,
        "distance_km": distance,
        "estimated_duration_minutes": distance * 2.5,
        "currency": "NGN",
    }
