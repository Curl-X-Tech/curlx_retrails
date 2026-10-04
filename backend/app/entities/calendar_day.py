import datetime as dt
from typing import Any

from sqlmodel import Field, SQLModel

from app.core.timezone import utc_now


class CalendarDay(SQLModel, table=True):
    """CalendarDay database entity tracking operating days, festivals, monsoons, and demand surge."""

    __tablename__ = "calendar_day"

    date: dt.date = Field(primary_key=True, nullable=False)
    dow: int = Field(nullable=False)  # 0 = Monday, 6 = Sunday
    dow_name: str = Field(nullable=False)  # 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    is_weekend: bool = Field(default=False, nullable=False)
    iso_year: int = Field(nullable=False, index=True)
    iso_week: int = Field(nullable=False, index=True)
    is_payday: bool = Field(default=False, nullable=False)
    festival: str | None = Field(default=None, nullable=True)
    festival_ramp: float = Field(default=0.0, nullable=False)
    is_holiday: bool = Field(default=False, nullable=False)
    monsoon: bool = Field(default=False, nullable=False)
    is_operating: bool = Field(default=True, nullable=False)
    created_at: dt.datetime = Field(default_factory=utc_now, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)
