"""Router: /vehicles/tree — VehicleTree hierarchy endpoints."""

from fastapi import APIRouter, Depends, Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.vehicle import VehicleModel
from app.schemas.vehicle_schemas import VehicleResponse, VehicleTreeNode

router = APIRouter(prefix="/vehicles", tags=["Vehicle Tree"])


def _build_tree(vehicles: list[VehicleModel], root_name: str = "root") -> dict:
    """Build root -> depot -> vehicle_type -> temp_condition -> Vehicle leaves hierarchy."""
    tree: dict = {}

    for v in vehicles:
        depot = v.depot
        v_type = v.type
        temp = v.temp_condition

        if depot not in tree:
            tree[depot] = {}
        if v_type not in tree[depot]:
            tree[depot][v_type] = {}
        if temp not in tree[depot][v_type]:
            tree[depot][v_type][temp] = []

        tree[depot][v_type][temp].append(VehicleResponse.model_validate(v))

    # Convert nested dicts into VehicleTreeNode structure
    depot_nodes = []
    for depot_name, types_dict in sorted(tree.items()):
        type_nodes = []
        for type_name, temps_dict in sorted(types_dict.items()):
            temp_nodes = []
            for temp_name, v_list in sorted(temps_dict.items()):
                temp_nodes.append({
                    "name": temp_name,
                    "children": v_list,
                })
            type_nodes.append({
                "name": type_name,
                "children": temp_nodes,
            })
        depot_nodes.append({
            "name": depot_name,
            "children": type_nodes,
        })

    return {
        "name": root_name,
        "children": depot_nodes,
    }


@router.get(
    "/tree",
    response_model=VehicleTreeNode,
    summary="Full VehicleTree as JSON",
    description=(
        "Returns the 3-level hierarchy: depot → vehicle_type → temp_condition → vehicles. "
        "Mirrors VehicleTree.get_tree_as_dict(). Role: DISPATCHER+"
    ),
)
async def get_vehicle_tree(
    db: AsyncSession = Depends(get_db),
):
    query = select(VehicleModel).where(VehicleModel.IsActive.is_(True)).order_by(VehicleModel.ID)
    vehicles = list((await db.execute(query)).scalars().all())
    tree_dict = _build_tree(vehicles, root_name="root")
    return tree_dict


@router.get(
    "/by-depot/{depot}",
    response_model=VehicleTreeNode,
    summary="VehicleTree scoped to a single depot",
    description="Returns the sub-tree for the given depot. Role: DISPATCHER+",
)
async def get_vehicle_tree_by_depot(
    depot: str = Path(...),
    db:    AsyncSession = Depends(get_db),
):
    query = (
        select(VehicleModel)
        .where(VehicleModel.depot == depot, VehicleModel.IsActive.is_(True))
        .order_by(VehicleModel.ID)
    )
    vehicles = list((await db.execute(query)).scalars().all())
    tree_dict = _build_tree(vehicles, root_name=depot)
    return tree_dict
