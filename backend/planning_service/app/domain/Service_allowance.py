"""
ServiceAllowance domain model.

Handling time (in minutes) budgeted per delivery stop.
The allowance is keyed on (brand, dock_type).
"""

from __future__ import annotations

from app.domain.Base import BaseModel


class ServiceAllowance(BaseModel):
    def __init__(
        self,
        ID: str,
        CreateTime,
        UpdateTime,
        CreatedBy: str,
        UpdatedBy: str,
        IsActive: bool,
        brand: str,
        dock_type: str,
        service_allowance_min: float,
    ) -> None:
        super().__init__(ID, CreateTime, UpdateTime, CreatedBy, UpdatedBy, IsActive)
        self.brand = brand
        self.dock_type = dock_type
        self.service_allowance_min = float(service_allowance_min)

    def get_brand(self) -> str:
        return self.brand

    def get_dock_type(self) -> str:
        return self.dock_type

    def get_service_allowance_min(self) -> float:
        return self.service_allowance_min

    def to_dict(self) -> dict:
        d = self._audit_dict()
        d.update(
            brand=self.brand,
            dock_type=self.dock_type,
            service_allowance_min=self.service_allowance_min,
        )
        return d

    def __str__(self) -> str:
        return (
            f"ServiceAllowance(brand={self.brand}, dock_type={self.dock_type}, "
            f"service_allowance_min={self.service_allowance_min})"
        )

    @staticmethod
    def get_service_allowance(
        brand: str,
        dock_type: str,
        service_allowances: list["ServiceAllowance"],
    ) -> float | None:
        for allowance in service_allowances:
            if allowance.get_brand() == brand and allowance.get_dock_type() == dock_type:
                return allowance.get_service_allowance_min()
        return None
