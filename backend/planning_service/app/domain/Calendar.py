"""
Calendar domain model.
"""

from __future__ import annotations

import datetime


class CalendarDate:
    """Represents a single date with all planning-relevant context."""

    __slots__ = (
        "date", "dow", "dow_name", "is_weekend", "is_payday",
        "is_holiday", "monsoon", "iso_year", "iso_week",
        "festival", "festival_ramp", "is_operating",
    )

    def __init__(
        self,
        date: datetime.date,
        dow: int,
        dow_name: str,
        is_weekend: bool,
        is_payday: bool,
        is_holiday: bool,
        monsoon: bool,
        iso_year: int,
        iso_week: int,
        festival: str | None,
        festival_ramp: float,
        is_operating: bool,
    ) -> None:
        self.date = date
        self.dow = int(dow)
        self.dow_name = dow_name
        self.is_weekend = bool(is_weekend)
        self.is_payday = bool(is_payday)
        self.is_holiday = bool(is_holiday)
        self.monsoon = bool(monsoon)
        self.iso_year = int(iso_year)
        self.iso_week = int(iso_week)
        self.festival = festival if isinstance(festival, str) and festival.strip() else None
        self.festival_ramp = float(festival_ramp)
        self.is_operating = bool(is_operating)

    @property
    def has_festival(self) -> bool:
        return self.festival is not None

    @property
    def is_high_demand(self) -> bool:
        return self.is_payday or self.festival_ramp >= 0.5

    def to_dict(self) -> dict:
        return {
            "date": self.date.isoformat(),
            "dow": self.dow,
            "dow_name": self.dow_name,
            "is_weekend": self.is_weekend,
            "is_payday": self.is_payday,
            "is_holiday": self.is_holiday,
            "monsoon": self.monsoon,
            "iso_year": self.iso_year,
            "iso_week": self.iso_week,
            "festival": self.festival,
            "festival_ramp": self.festival_ramp,
            "is_operating": self.is_operating,
        }

    def __str__(self) -> str:
        flags = []
        if self.is_payday:
            flags.append("payday")
        if self.festival:
            flags.append(f"festival={self.festival}(ramp={self.festival_ramp:.1f})")
        if self.monsoon:
            flags.append("monsoon")
        if not self.is_operating:
            flags.append("NON-OPERATING")
        flag_str = ", ".join(flags) if flags else "normal"
        return f"CalendarDate({self.date.isoformat()}, {self.dow_name}, {flag_str})"


class Calendar:
    def __init__(self) -> None:
        self._dates: dict[datetime.date, CalendarDate] = {}

    def add_date(self, calendar_date: CalendarDate) -> None:
        self._dates[calendar_date.date] = calendar_date

    def get_date(self, date: datetime.date) -> CalendarDate | None:
        return self._dates.get(date)

    def is_operating(self, date: datetime.date) -> bool:
        entry = self._dates.get(date)
        return entry.is_operating if entry is not None else False

    def get_operating_dates_in_week(self, iso_year: int, iso_week: int) -> list[CalendarDate]:
        return [
            d for d in self._dates.values()
            if d.iso_year == iso_year and d.iso_week == iso_week and d.is_operating
        ]

    def get_high_demand_dates(self) -> list[CalendarDate]:
        today = datetime.date.today()
        return [
            d for d in sorted(self._dates.values(), key=lambda x: x.date)
            if d.date >= today and d.is_high_demand and d.is_operating
        ]

    def __len__(self) -> int:
        return len(self._dates)

    def __repr__(self) -> str:
        return f"Calendar(dates={len(self._dates)})"
