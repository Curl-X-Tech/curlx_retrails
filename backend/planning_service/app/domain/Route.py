"""
Route domain model.

One Route record covers the relationship between a depot and a district.
It encodes the road geometry used for trip-time calculations.
"""

from __future__ import annotations

from app.domain.Base import BaseModel


class Route(BaseModel):
    def __init__(
        self,
        ID: str,
        CreateTime,
        UpdateTime,
        CreatedBy: str,
        UpdatedBy: str,
        IsActive: bool,
        district: str,
        depot: str,
        road_class: str,
        free_flow_kmh: float,
        depot_to_district_km: float,
        depot_to_district_freeflow_min: float,
        inter_stop_km: float,
        inter_stop_freeflow_min: float,
    ) -> None:
        super().__init__(ID, CreateTime, UpdateTime, CreatedBy, UpdatedBy, IsActive)
        self.district = district
        self.depot = depot
        self.road_class = road_class
        self.free_flow_kmh = float(free_flow_kmh)
        self.depot_to_district_km = float(depot_to_district_km)
        self.depot_to_district_freeflow_min = float(depot_to_district_freeflow_min)
        self.inter_stop_km = float(inter_stop_km)
        self.inter_stop_freeflow_min = float(inter_stop_freeflow_min)

    def calculate_trip_minutes(self, stop_count: int, service_allowances_min: list[float]) -> float:
        if stop_count <= 0:
            return 0.0
        outbound = self.depot_to_district_freeflow_min
        inter_stop = self.inter_stop_freeflow_min * max(0, stop_count - 1)
        handling = sum(service_allowances_min)
        return outbound + inter_stop + handling

    def round_trip_km(self) -> float:
        return 2.0 * self.depot_to_district_km

    def get_depot(self) -> str:
        return self.depot

    def get_district(self) -> str:
        return self.district

    def get_road_class(self) -> str:
        return self.road_class

    def get_free_flow_kmh(self) -> float:
        return self.free_flow_kmh

    def get_depot_to_district_km(self) -> float:
        return self.depot_to_district_km

    def get_depot_to_district_freeflow_min(self) -> float:
        return self.depot_to_district_freeflow_min

    def get_inter_stop_km(self) -> float:
        return self.inter_stop_km

    def get_inter_stop_freeflow_min(self) -> float:
        return self.inter_stop_freeflow_min

    def to_dict_compact(self) -> dict:
        return {
            "ID": self.ID,
            "depot": self.depot,
            "district": self.district,
            "road_class": self.road_class,
            "free_flow_kmh": self.free_flow_kmh,
            "depot_to_district_km": self.depot_to_district_km,
            "depot_to_district_freeflow_min": self.depot_to_district_freeflow_min,
            "inter_stop_km": self.inter_stop_km,
            "inter_stop_freeflow_min": self.inter_stop_freeflow_min,
        }

    def __str__(self) -> str:
        return (
            f"Route(ID={self.ID}, depot={self.depot}, district={self.district}, "
            f"road_class={self.road_class}, "
            f"depot_to_district_km={self.depot_to_district_km}, "
            f"inter_stop_km={self.inter_stop_km})"
        )

    @staticmethod
    def find_route(depot: str, district: str, routes: list["Route"]) -> "Route | None":
        for route in routes:
            if route.get_depot() == depot and route.get_district() == district:
                return route
        return None
