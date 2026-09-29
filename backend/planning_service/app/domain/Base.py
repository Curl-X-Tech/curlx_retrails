"""
Base model shared by all domain entities.

All IDs are opaque strings (UUID or business key). Timestamps are datetime
objects. CreatedBy / UpdatedBy hold the operator string at write time.
"""

from datetime import datetime


class BaseModel:
    """Lightweight audit-tracked record."""

    __slots__ = ("ID", "CreateTime", "UpdateTime", "CreatedBy", "UpdatedBy", "IsActive")

    def __init__(
        self,
        ID: str,
        CreateTime: datetime,
        UpdateTime: datetime,
        CreatedBy: str,
        UpdatedBy: str,
        IsActive: bool,
    ) -> None:
        self.ID = ID
        self.CreateTime = CreateTime
        self.UpdateTime = UpdateTime
        self.CreatedBy = CreatedBy
        self.UpdatedBy = UpdatedBy
        self.IsActive = IsActive

    def _audit_dict(self) -> dict:
        return {
            "ID": self.ID,
            "CreateTime": self.CreateTime.isoformat() if self.CreateTime else None,
            "UpdateTime": self.UpdateTime.isoformat() if self.UpdateTime else None,
            "CreatedBy": self.CreatedBy,
            "UpdatedBy": self.UpdatedBy,
            "IsActive": self.IsActive,
        }


base_model = BaseModel
