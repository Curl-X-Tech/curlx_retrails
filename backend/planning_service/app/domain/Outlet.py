"""
Outlet domain model.
"""

from __future__ import annotations

from app.domain.Base import BaseModel


class Outlet(BaseModel):
    def __init__(
        self,
        ID: str,
        CreateTime,
        UpdateTime,
        CreatedBy: str,
        UpdatedBy: str,
        IsActive: bool,
        brand: str,
        district: str,
        depot: str,
        dock_type: str,
        parking_constraint: str,
        mall_window: str | None,
        window_open_time: str,
        window_close_time: str,
    ) -> None:
        super().__init__(ID, CreateTime, UpdateTime, CreatedBy, UpdatedBy, IsActive)
        self.brand = brand
        self.district = district
        self.depot = depot
        self.dock_type = dock_type
        self.parking_constraint = parking_constraint
        self.mall_window: str | None = mall_window if isinstance(mall_window, str) and mall_window.strip() else None
        self.window_open_time = window_open_time
        self.window_close_time = window_close_time

    @property
    def is_mall(self) -> bool:
        return self.parking_constraint == "mall_dock"

    @property
    def requires_van(self) -> bool:
        return self.parking_constraint == "van_only"

    def effective_open_time(self) -> str:
        if self.is_mall and self.mall_window:
            mall_open, _ = self._parse_mall_window()
            return max(self.window_open_time, mall_open)
        return self.window_open_time

    def effective_close_time(self) -> str:
        if self.is_mall and self.mall_window:
            _, mall_close = self._parse_mall_window()
            return min(self.window_close_time, mall_close)
        return self.window_close_time

    def _parse_mall_window(self) -> tuple[str, str]:
        parts = self.mall_window.split("-")
        if len(parts) != 2:
            raise ValueError(f"Outlet {self.ID}: malformed mall_window '{self.mall_window}'")
        return parts[0].strip(), parts[1].strip()

    def __str__(self) -> str:
        return (
            f"Outlet(ID={self.ID}, brand={self.brand}, district={self.district}, "
            f"depot={self.depot}, dock_type={self.dock_type}, "
            f"parking_constraint={self.parking_constraint}, "
            f"window={self.window_open_time}-{self.window_close_time})"
        )

    def __repr__(self) -> str:
        return self.__str__()
