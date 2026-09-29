"""
Order domain model and OrderTree clustering.
"""

from __future__ import annotations

import datetime
from app.domain.Base import BaseModel
from app.domain.Route import Route


class Order(BaseModel):
    def __init__(
        self,
        ID: str,
        CreateTime,
        UpdateTime,
        CreatedBy: str,
        UpdatedBy: str,
        IsActive: bool,
        outlet_id: str,
        order_date: datetime.date,
        order_time: datetime.time,
        weight_kg: float,
        volume_m3: float,
        temp_condition: str,
    ) -> None:
        super().__init__(ID, CreateTime, UpdateTime, CreatedBy, UpdatedBy, IsActive)
        self.outlet_id = outlet_id
        self.order_date = self._coerce_date(order_date)
        self.order_time = self._coerce_time(order_time)
        self.weight_kg = float(weight_kg)
        self.volume_m3 = float(volume_m3)
        self.temp_condition = str(temp_condition).strip().lower()

    @staticmethod
    def _coerce_date(value) -> datetime.date | None:
        if value is None:
            return None
        if isinstance(value, datetime.datetime):
            return value.date()
        if isinstance(value, datetime.date):
            return value
        if isinstance(value, str) and value.strip():
            return datetime.date.fromisoformat(value.strip())
        return None

    @staticmethod
    def _coerce_time(value) -> datetime.time | None:
        if value is None:
            return None
        if isinstance(value, datetime.time):
            return value
        if isinstance(value, datetime.datetime):
            return value.time()
        if isinstance(value, str) and value.strip():
            parts = value.strip().split(":")
            h, m = int(parts[0]), int(parts[1])
            s = int(parts[2]) if len(parts) > 2 else 0
            return datetime.time(h, m, s)
        return None

    def get_outlet(self, outlets):
        for outlet in outlets:
            if outlet.ID == self.outlet_id:
                return outlet
        return None

    def get_depot(self, outlets) -> str | None:
        outlet = self.get_outlet(outlets)
        return outlet.depot if outlet else None

    def get_district(self, outlets) -> str | None:
        outlet = self.get_outlet(outlets)
        return outlet.district if outlet else None

    def get_brand(self, outlets) -> str | None:
        outlet = self.get_outlet(outlets)
        return outlet.brand if outlet else None

    def get_type(self, outlets) -> str | None:
        return self.get_brand(outlets)

    def get_dock_type(self, outlets) -> str | None:
        outlet = self.get_outlet(outlets)
        return outlet.dock_type if outlet else None

    def get_parking_constraint(self, outlets) -> str | None:
        outlet = self.get_outlet(outlets)
        return outlet.parking_constraint if outlet else None

    def get_window_open_time(self, outlets) -> str | None:
        outlet = self.get_outlet(outlets)
        return outlet.effective_open_time() if outlet else None

    def get_window_close_time(self, outlets) -> str | None:
        outlet = self.get_outlet(outlets)
        return outlet.effective_close_time() if outlet else None

    def get_id(self) -> str:
        return self.ID

    def get_weight(self) -> float:
        return self.weight_kg

    def get_volume(self) -> float:
        return self.volume_m3

    def get_temp_condition(self) -> str:
        return self.temp_condition

    def requires_reefer(self) -> bool:
        return self.temp_condition in ("chilled", "frozen")

    def to_dict(self, outlets) -> dict:
        d = self._audit_dict()
        d.update(
            outlet_id=self.outlet_id,
            order_date=self.order_date.isoformat() if self.order_date else None,
            order_time=self.order_time.isoformat() if self.order_time else None,
            weight_kg=self.weight_kg,
            volume_m3=self.volume_m3,
            temp_condition=self.temp_condition,
        )
        return d

    def to_dict_compact(self, outlets) -> dict:
        return {
            "ID": self.ID,
            "outlet_id": self.outlet_id,
            "weight_kg": self.weight_kg,
            "volume_m3": self.volume_m3,
            "temp_condition": self.temp_condition,
            "outlet_open_time": self.get_window_open_time(outlets),
            "outlet_close_time": self.get_window_close_time(outlets),
        }

    def __str__(self) -> str:
        return (
            f"Order(ID={self.ID}, outlet_id={self.outlet_id}, "
            f"date={self.order_date}, weight_kg={self.weight_kg}, "
            f"volume_m3={self.volume_m3}, temp={self.temp_condition})"
        )

    def __repr__(self) -> str:
        return self.__str__()


class _TreeNode:
    __slots__ = ("_name", "_children", "_orders")

    def __init__(self, name: str) -> None:
        self._name = name
        self._children: list[_TreeNode] = []
        self._orders: list[Order] = []

    def add_child(self, child: "_TreeNode") -> None:
        self._children.append(child)

    def add_order(self, order: Order) -> None:
        self._orders.append(order)

    def get_children(self) -> list["_TreeNode"]:
        return self._children

    def get_name(self) -> str:
        return self._name

    def get_orders(self) -> list[Order]:
        return self._orders

    def get_order_ids(self) -> list[str]:
        return [o.get_id() for o in self._orders]

    def total_weight(self) -> float:
        return sum(o.get_weight() for o in self._orders)

    def total_volume(self) -> float:
        return sum(o.get_volume() for o in self._orders)


class OrderTree:
    def __init__(self) -> None:
        self._root = _TreeNode("root")

    def add_order(self, order: Order, outlets) -> None:
        depot = order.get_depot(outlets)
        district = order.get_district(outlets)
        brand = order.get_brand(outlets)
        parking = order.get_parking_constraint(outlets)
        temp = order.get_temp_condition()

        if None in (depot, district, brand, parking, temp):
            raise ValueError(
                f"Order {order.ID}: cannot resolve outlet attributes "
                f"(outlet_id={order.outlet_id}). Check outlets list."
            )

        depot_node = self._get_or_create(self._root, depot)
        district_node = self._get_or_create(depot_node, district)
        brand_node = self._get_or_create(district_node, brand)
        parking_node = self._get_or_create(brand_node, parking)
        temp_node = self._get_or_create(parking_node, temp)
        temp_node.add_order(order)

    def _get_or_create(self, parent: _TreeNode, name: str) -> _TreeNode:
        for child in parent.get_children():
            if child.get_name() == name:
                return child
        node = _TreeNode(name)
        parent.add_child(node)
        return node

    def get_root(self) -> _TreeNode:
        return self._root

    def traverse(self, node: _TreeNode | None = None, level: int = 0) -> None:
        node = node or self._root
        print("  " * level + f"[{node.get_name()}]  orders={len(node.get_orders())}")
        for child in node.get_children():
            self.traverse(child, level + 1)

    def get_orders_by_level(self, level: int) -> list[dict]:
        result: list[dict] = []
        self._collect_by_level(self._root, level, [], result)
        return result

    def _collect_by_level(
        self,
        node: _TreeNode,
        target: int,
        path: list[str],
        result: list[dict],
    ) -> None:
        path.append(node.get_name())
        if len(path) - 1 == target:
            result.append(
                {
                    "specifier": "->".join(path[1:]),
                    "orders": node.get_order_ids(),
                    "total_weight_kg": node.total_weight(),
                    "total_volume_m3": node.total_volume(),
                }
            )
        else:
            for child in node.get_children():
                self._collect_by_level(child, target, path, result)
        path.pop()

    def get_tree_as_dict(self, node: _TreeNode | None = None) -> dict:
        node = node or self._root
        return {
            "name": node.get_name(),
            "orders": node.get_order_ids(),
            "total_weight_kg": node.total_weight(),
            "total_volume_m3": node.total_volume(),
            "children": [self.get_tree_as_dict(c) for c in node.get_children()],
        }

    def get_tree_as_a_dict(self) -> dict:
        return self.get_tree_as_dict()

    def create_all_trips(self, outlets, routes, sys_user: str | None = None) -> list:
        from app.domain.Trip import Trip
        trips: list[Trip] = []
        self._collect_trips(self._root, trips, outlets, routes, sys_user, [])
        return trips

    def _collect_trips(
        self,
        node: _TreeNode,
        trips: list,
        outlets,
        routes,
        sys_user: str | None,
        path: list[str],
    ) -> None:
        from app.domain.Trip import Trip
        current_path = path + [node.get_name()]

        if node.get_orders() and not node.get_children():
            sample_order = node.get_orders()[0]
            depot = sample_order.get_depot(outlets)
            district = sample_order.get_district(outlets)
            route = Route.find_route(depot, district, routes)

            operation_id = "_".join(str(p) for p in current_path[1:])
            trip = Trip(
                ID=f"Trip_{operation_id}",
                CreateTime=datetime.datetime.now(),
                UpdateTime=datetime.datetime.now(),
                CreatedBy=sys_user,
                UpdatedBy=sys_user,
                IsActive=True,
                route=route,
                order_queue=list(node.get_orders()),
                outlets=outlets,
            )
            trips.append(trip)

        for child in node.get_children():
            self._collect_trips(child, trips, outlets, routes, sys_user, current_path)
