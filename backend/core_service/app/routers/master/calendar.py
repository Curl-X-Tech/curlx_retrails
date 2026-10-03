from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.core.timezone import sl_today
from app.entities.calendar_day import CalendarDay
from app.entities.user import User
from app.guards import require_system_admin
from app.schemas.calendar_day import (
    CalendarBulkGenerate,
    CalendarDayCreate,
    CalendarDayRead,
    CalendarDayUpdate,
    DemandSurgeRead,
)

router = APIRouter(prefix="/calendar", tags=["master-calendar"])


def build_calendar_day(day_in: CalendarDayCreate) -> CalendarDay:
    d = day_in.date
    dow = d.weekday()
    iso_year, iso_week, _ = d.isocalendar()
    is_weekend = dow == 6  # Sunday off in Sri Lankan retail logistics
    is_payday = day_in.is_payday if day_in.is_payday is not None else (25 <= d.day <= 28)
    is_operating = (
        day_in.is_operating if day_in.is_operating is not None else (not is_weekend and not day_in.is_holiday)
    )
    return CalendarDay(
        date=d,
        dow=dow,
        dow_name=d.strftime("%a"),
        is_weekend=is_weekend,
        iso_year=iso_year,
        iso_week=iso_week,
        is_payday=is_payday,
        festival=day_in.festival,
        festival_ramp=day_in.festival_ramp,
        is_holiday=day_in.is_holiday,
        monsoon=day_in.monsoon,
        is_operating=is_operating,
    )


@router.get(
    "",
    response_model=list[CalendarDayRead],
    summary="List operational calendar days and schedule constraints",
)
async def list_calendar_days(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    from_date: Annotated[date | None, Query(description="Filter start date YYYY-MM-DD")] = None,
    to_date: Annotated[date | None, Query(description="Filter end date YYYY-MM-DD")] = None,
    is_operating: Annotated[bool | None, Query(description="Filter by delivery operating status")] = None,
    is_holiday: Annotated[bool | None, Query(description="Filter by public holiday status")] = None,
    festival: Annotated[str | None, Query(description="Filter by specific festival")] = None,
) -> list[CalendarDay]:
    """Retrieve operational calendar days across Western and Central routes."""
    query = select(CalendarDay).order_by(CalendarDay.date.asc())
    if from_date is not None:
        query = query.where(CalendarDay.date >= from_date)
    if to_date is not None:
        query = query.where(CalendarDay.date <= to_date)
    if is_operating is not None:
        query = query.where(CalendarDay.is_operating == is_operating)
    if is_holiday is not None:
        query = query.where(CalendarDay.is_holiday == is_holiday)
    if festival is not None:
        query = query.where(CalendarDay.festival == festival)

    result = await session.execute(query)
    return list(result.scalars().all())


@router.get(
    "/operating-days",
    response_model=list[CalendarDayRead],
    summary="Get upcoming active operating delivery days",
)
async def get_upcoming_operating_days(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    start_date: Annotated[
        date | None,
        Query(description="Starting evaluation date (defaults to Sri Lanka today YYYY-MM-DD)"),
    ] = None,
    days: Annotated[int, Query(ge=1, le=90, description="Number of future days to inspect")] = 14,
) -> list[CalendarDay]:
    """Retrieve upcoming active delivery days for dispatch and replenishment planning."""
    base_date = start_date or sl_today()
    end_date = base_date + timedelta(days=days)

    query = (
        select(CalendarDay)
        .where(
            CalendarDay.date >= base_date,
            CalendarDay.date <= end_date,
            CalendarDay.is_operating.is_(True),
        )
        .order_by(CalendarDay.date.asc())
    )

    result = await session.execute(query)
    return list(result.scalars().all())


@router.get(
    "/surge",
    response_model=list[DemandSurgeRead],
    summary="Get demand surge and seasonal factors by date range",
)
async def get_demand_surge(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    from_date: Annotated[date | None, Query(description="Start date (defaults to Sri Lanka today)")] = None,
    to_date: Annotated[date | None, Query(description="End date (defaults to today + 30 days)")] = None,
) -> list[DemandSurgeRead]:
    """Calculate demand multipliers based on festivals, paydays, and monsoon seasons."""
    start_d = from_date or sl_today()
    end_d = to_date or (start_d + timedelta(days=30))

    query = (
        select(CalendarDay)
        .where(CalendarDay.date >= start_d, CalendarDay.date <= end_d)
        .order_by(CalendarDay.date.asc())
    )

    result = await session.execute(query)
    days = result.scalars().all()

    surge_list: list[DemandSurgeRead] = []
    for day in days:
        multiplier = 1.0
        # Festival surge impact up to +40%
        multiplier += day.festival_ramp * 0.40
        # Payday surge impact +15%
        if day.is_payday:
            multiplier += 0.15
        # Monsoon adverse delivery penalty -5%
        if day.monsoon:
            multiplier -= 0.05

        surge_list.append(
            DemandSurgeRead(
                date=day.date,
                dow_name=day.dow_name,
                festival=day.festival,
                festival_ramp=day.festival_ramp,
                is_payday=day.is_payday,
                monsoon=day.monsoon,
                surge_multiplier=round(multiplier, 2),
            )
        )

    return surge_list


@router.get(
    "/{day_date}",
    response_model=CalendarDayRead,
    summary="Get calendar day details by date YYYY-MM-DD",
)
async def get_calendar_day(
    day_date: date,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> CalendarDay:
    """Retrieve specific calendar day record."""
    calendar_day = await session.get(CalendarDay, day_date)
    if not calendar_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CALENDAR_DAY_NOT_FOUND",
        )
    return calendar_day


@router.post(
    "",
    response_model=CalendarDayRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new calendar day record (Admin only)",
)
async def create_calendar_day(
    day_in: CalendarDayCreate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> CalendarDay:
    """Create a new calendar day record."""
    existing = await session.get(CalendarDay, day_in.date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CALENDAR_DATE_ALREADY_EXISTS",
        )

    calendar_day = build_calendar_day(day_in)
    session.add(calendar_day)
    await session.commit()
    await session.refresh(calendar_day)
    return calendar_day


@router.post(
    "/bulk-generate",
    response_model=list[CalendarDayRead],
    status_code=status.HTTP_201_CREATED,
    summary="Generate missing calendar days for a date range (Admin only)",
)
async def bulk_generate_calendar(
    range_in: CalendarBulkGenerate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[CalendarDay]:
    """Create default records for dates in the range that do not exist yet; existing days are kept."""
    existing = (
        (
            await session.execute(
                select(CalendarDay.date).where(
                    CalendarDay.date >= range_in.from_date, CalendarDay.date <= range_in.to_date
                )
            )
        )
        .scalars()
        .all()
    )
    existing_dates = set(existing)
    span = (range_in.to_date - range_in.from_date).days + 1
    created = [
        build_calendar_day(CalendarDayCreate(date=range_in.from_date + timedelta(days=offset)))
        for offset in range(span)
        if range_in.from_date + timedelta(days=offset) not in existing_dates
    ]
    session.add_all(created)
    await session.commit()
    for day in created:
        await session.refresh(day)
    return created


@router.patch(
    "/{date}",
    response_model=CalendarDayRead,
    summary="Update calendar day attributes (Admin only)",
)
@router.put(
    "/{date}",
    response_model=CalendarDayRead,
    summary="Update calendar day attributes (Admin only)",
)
async def update_calendar_day(
    date: date,
    day_in: CalendarDayUpdate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> CalendarDay:
    """Update calendar day attributes (e.g. override operating status or mark holiday)."""
    calendar_day = await session.get(CalendarDay, date)
    if not calendar_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CALENDAR_DAY_NOT_FOUND",
        )

    update_data = day_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(calendar_day, field, value)

    await session.commit()
    await session.refresh(calendar_day)
    return calendar_day


@router.delete(
    "/{day_date}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a calendar day record (Admin only)",
)
async def delete_calendar_day(
    day_date: date,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> None:
    """Delete a calendar day record."""
    calendar_day = await session.get(CalendarDay, day_date)
    if not calendar_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CALENDAR_DAY_NOT_FOUND",
        )
    try:
        await session.delete(calendar_day)
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CALENDAR_DAY_IN_USE_CANNOT_DELETE",
        )
