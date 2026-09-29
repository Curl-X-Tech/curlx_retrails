"""
Vehicle domain model.
"""

from __future__ import annotations

from app.domain.Base import BaseModel


class Vehicle(BaseModel):
    def __init__(
        self,
        ID: str,
        CreateTime,
        UpdateTime,
        CreatedBy: str,
        UpdatedBy: str,
        IsActive: bool,
        type: str,              # truck | van
        temp_condition: str,    # reefer | ambient
        weight_cap_kg: float,
        volume_cap_m3: float,
        fuel_type: str,
        km_per_l: float,
        weekly_fuel_quota: float,   # in litres
        depot: str,
        service_milage: float = 0.0,
    ) -> None:
        super().__init__(ID, CreateTime, UpdateTime, CreatedBy, UpdatedBy, IsActive)
        self.type = type                        # truck | van
        self.temp_condition = temp_condition    # reefer | ambient
        self.weight_cap_kg = float(weight_cap_kg)
        self.volume_cap_m3 = float(volume_cap_m3)
        self.fuel_type = fuel_type
        self.km_per_l = float(km_per_l)
        self.weekly_fuel_quota = float(weekly_fuel_quota)   # litres
        self.depot = depot
        self.service_milage = float(service_milage)         # km used this week
        self.trip_count_today: int = 0
        self.max_per_day_trip_count: int = 2
        self.driver = None

    def get_weight_capacity(self) -> float:
        return self.weight_cap_kg

    def get_volume_capacity(self) -> float:
        return self.volume_cap_m3

    def fits_load(self, weight_kg: float, volume_m3: float) -> bool:
        return weight_kg <= self.weight_cap_kg and volume_m3 <= self.volume_cap_m3

    def get_temp_condition(self) -> str:
        return self.temp_condition

    def can_carry_temp(self, required: str) -> bool:
        if self.temp_condition == "reefer":
            return True
        return required == "ambient"

    def get_depot(self) -> str:
        return self.depot

    def serves_depot(self, depot: str) -> bool:
        return self.depot == depot

    def can_access_outlet_type(self, parking_constraint: str) -> bool:
        if parking_constraint == "van_only":
            return self.type == "van"
        return True

    def get_km_per_l(self) -> float:
        return self.km_per_l

    def get_weekly_fuel_quota(self) -> float:
        return self.weekly_fuel_quota

    def get_service_milage(self) -> float:
        return self.service_milage

    def max_weekly_range_km(self) -> float:
        return self.km_per_l * self.weekly_fuel_quota

    def remaining_range_km(self) -> float:
        return max(0.0, self.max_weekly_range_km() - self.service_milage)

    def has_fuel_for(self, distance_km: float) -> bool:
        return self.service_milage + distance_km <= self.max_weekly_range_km()

    def add_milage(self, km: float) -> None:
        self.service_milage += km

    def calculate_possible_travel_distance(self) -> float:
        return self.max_weekly_range_km()

    def get_remaining_trip_count(self) -> int:
        return max(0, self.max_per_day_trip_count - self.trip_count_today)

    def has_trips_remaining(self) -> bool:
        return self.get_remaining_trip_count() > 0

    def increment_trip_count(self) -> None:
        self.trip_count_today += 1

    def reset_daily_counts(self) -> None:
        self.trip_count_today = 0

    def is_eligible_for(
        self,
        depot: str,
        parking_constraint: str,
        temp_requirement: str,
        round_trip_km: float,
    ) -> tuple[bool, str]:
        if not self.serves_depot(depot):
            return False, f"wrong depot ({self.depot} ≠ {depot})"
        if not self.can_access_outlet_type(parking_constraint):
            return False, f"parking_constraint={parking_constraint} requires van"
        if not self.can_carry_temp(temp_requirement):
            return False, f"temp={self.temp_condition} cannot carry {temp_requirement}"
        if not self.has_trips_remaining():
            return False, "daily trip limit reached"
        if not self.has_fuel_for(round_trip_km):
            return False, f"fuel exhausted ({self.service_milage:.1f}+{round_trip_km:.1f} > {self.max_weekly_range_km():.1f} km)"
        return True, "ok"

    def to_dict(self) -> dict:
        d = self._audit_dict()
        d.update(
            type=self.type,
            temp_condition=self.temp_condition,
            weight_cap_kg=self.weight_cap_kg,
            volume_cap_m3=self.volume_cap_m3,
            fuel_type=self.fuel_type,
            km_per_l=self.km_per_l,
            weekly_fuel_quota=self.weekly_fuel_quota,
            depot=self.depot,
            service_milage=self.service_milage,
            trip_count_today=self.trip_count_today,
            max_per_day_trip_count=self.max_per_day_trip_count,
        )
        return d

    def __str__(self) -> str:
        return (
            f"Vehicle(ID={self.ID}, type={self.type}, temp={self.temp_condition}, "
            f"depot={self.depot}, cap={self.weight_cap_kg}kg/{self.volume_cap_m3}m³, "
            f"milage={self.service_milage:.1f}/{self.max_weekly_range_km():.1f}km, "
            f"trips_today={self.trip_count_today}/{self.max_per_day_trip_count})"
        )

    def __repr__(self) -> str:
        return self.__str__()


class _VehicleNode:
    __slots__ = ("name", "children")

    def __init__(self, name: str) -> None:
        self.name = name
        self.children: list = []

    def get_name(self) -> str:
        return self.name

    def get_vehicles(self) -> list:
        return self.children

    def add_child(self, child) -> None:
        self.children.append(child)


class VehicleTree:
    def __init__(self) -> None:
        self._root = _VehicleNode("root")

    def add_vehicle(self, vehicle: Vehicle) -> None:
        depot_node = self._get_or_create(self._root, vehicle.get_depot())
        type_node = self._get_or_create(depot_node, vehicle.type)
        temp_node = self._get_or_create(type_node, vehicle.get_temp_condition())
        temp_node.add_child(vehicle)

    def _get_or_create(self, parent: _VehicleNode, name: str) -> _VehicleNode:
        for child in parent.get_vehicles():
            if isinstance(child, _VehicleNode) and child.get_name() == name:
                return child
        node = _VehicleNode(name)
        parent.add_child(node)
        return node

    def get_vehicles(
        self,
        depot: str | None = None,
        vehicle_type: str | None = None,
        temp_condition: str | None = None,
    ) -> list[Vehicle]:
        result: list[Vehicle] = []

        def _collect(node, path: list[str]) -> None:
            if isinstance(node, Vehicle):
                node_depot, node_type, node_temp = path[0], path[1], path[2]
                if depot is not None and node_depot != depot:
                    return
                if vehicle_type is not None and node_type != vehicle_type:
                    return
                if temp_condition is not None and node_temp != temp_condition:
                    return
                result.append(node)
                return

            for child in node.get_vehicles():
                if isinstance(child, _VehicleNode):
                    next_path = path + [child.get_name()]
                else:
                    next_path = path
                _collect(child, next_path)

        for depot_node in self._root.get_vehicles():
            for type_node in depot_node.get_vehicles():
                for temp_node in type_node.get_vehicles():
                    for vehicle in temp_node.get_vehicles():
                        _collect(
                            vehicle,
                            [depot_node.get_name(), type_node.get_name(), temp_node.get_name()],
                        )
        return result

    def get_tree_as_dict(self) -> dict:
        return self._node_to_dict(self._root)

    def _node_to_dict(self, node) -> dict:
        if isinstance(node, Vehicle):
            return node.to_dict()
        return {
            "name": node.get_name(),
            "children": [self._node_to_dict(c) for c in node.get_vehicles()],
        }

    def get_tree_as_a_dict(self) -> dict:
        return self.get_tree_as_dict()
