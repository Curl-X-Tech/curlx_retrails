import json
import shutil
from pathlib import Path

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import app.db.seed_json as seed_json
from app.db.seed import seed_database
from app.entities.user import User
from app.models.driver import DriverModel
from app.models.vehicle import VehicleModel


@pytest.mark.asyncio
async def test_seed_is_idempotent_and_linked(session: AsyncSession) -> None:
    first = await seed_database(session)
    second = await seed_database(session)

    assert first["vehicles"] == 60
    assert first["drivers"] == 60
    assert all(count == 0 for count in second.values())

    vehicles = (await session.execute(select(func.count()).select_from(VehicleModel))).scalar()
    drivers = (await session.execute(select(func.count()).select_from(DriverModel))).scalar()
    assert vehicles == drivers == 60
    default_driver = (await session.execute(select(User).where(User.email == "driver@curlx.tech"))).scalar_one()
    assert (await session.get(DriverModel, str(default_driver.id))) is not None


@pytest.mark.asyncio
async def test_seed_reports_orphans_and_duplicates(
    session: AsyncSession, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    broken = tmp_path / "seed_data"
    shutil.copytree(seed_json.SEED_DIR, broken)
    outlets = json.loads((broken / "outlets.json").read_text())
    outlets.append({**outlets[0], "latitude": 48.85})
    (broken / "outlets.json").write_text(json.dumps(outlets))
    monkeypatch.setattr(seed_json, "SEED_DIR", broken)

    with pytest.raises(seed_json.SeedValidationError) as excinfo:
        await seed_database(session)

    assert any("'latitude' out of range" in e for e in excinfo.value.errors)
    assert any("duplicate outlet_id" in e for e in excinfo.value.errors)
    assert (await session.execute(select(func.count()).select_from(User))).scalar() == 0
