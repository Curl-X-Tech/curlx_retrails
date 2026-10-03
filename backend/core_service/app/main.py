"""
Core Service re-export wrapper forwarding to unified backend app.
"""

from app.main import app

__all__ = ["app"]
