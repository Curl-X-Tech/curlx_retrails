import datetime as dt

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CalendarDayBase(BaseModel):
    date: dt.date
    dow: int = Field(ge=0, le=6)
    dow_name: str
    is_weekend: bool = False
    iso_year: int
    iso_week: int
    is_payday: bool = False
    festival: str | None = None
    festival_ramp: float = Field(default=0.0, ge=0.0, le=1.0)
    is_holiday: bool = False
    monsoon: bool = False
    is_operating: bool = True


class CalendarDayCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: dt.date
    festival: str | None = None
    festival_ramp: float = Field(default=0.0, ge=0.0, le=1.0)
    is_holiday: bool = False
    monsoon: bool = False
    is_payday: bool | None = None
    is_operating: bool | None = None


class CalendarBulkGenerate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    from_date: dt.date
    to_date: dt.date

    @model_validator(mode="after")
    def validate_range(self) -> "CalendarBulkGenerate":
        if self.to_date < self.from_date:
            raise ValueError("to_date must not be before from_date")
        if (self.to_date - self.from_date).days > 365:
            raise ValueError("range must not exceed 366 days")
        return self


class CalendarDayUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_payday: bool | None = None
    festival: str | None = None
    festival_ramp: float | None = Field(default=None, ge=0.0, le=1.0)
    is_holiday: bool | None = None
    monsoon: bool | None = None
    is_operating: bool | None = None


class CalendarDayRead(CalendarDayBase):
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class DemandSurgeRead(BaseModel):
    date: dt.date
    dow_name: str
    festival: str | None = None
    festival_ramp: float
    is_payday: bool
    monsoon: bool
    surge_multiplier: float
