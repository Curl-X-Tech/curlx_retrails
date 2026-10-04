"""Row-level scoping: dispatchers see only their own trips and orders; admins see all."""

from typing import Any

from sqlalchemy import and_, or_, select

from app.entities.customer_order import CustomerOrder
from app.entities.trip import RouteLeg, Trip
from app.entities.user import User
from app.enums.roles import UserType

OPEN_STATUSES = ("pending", "deferred")


def is_scoped(user: User | None) -> bool:
    return user is not None and user.user_type == UserType.DISPATCHER


def trip_scope(user: User) -> Any:
    return Trip.created_by == user.id


def order_scope(user: User) -> Any:
    """Own orders, orders on own trips, and unclaimed open orders not created by another dispatcher."""
    on_own_trips = select(RouteLeg.order_id).join(Trip, Trip.id == RouteLeg.trip_id).where(trip_scope(user))
    other_dispatchers = select(User.id).where(User.user_type == UserType.DISPATCHER, User.id != user.id)
    return or_(
        CustomerOrder.created_by == user.id,
        CustomerOrder.id.in_(on_own_trips),
        and_(CustomerOrder.status.in_(OPEN_STATUSES), CustomerOrder.created_by.not_in(other_dispatchers)),
    )
