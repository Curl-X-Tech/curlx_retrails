import {
  useBrands,
  useCreateCalendarDay,
  useCreateDepot,
  useCreateItem,
  useCreateOutlet,
  useDeleteCalendarDay,
  useDeleteDepot,
  useDeleteItem,
  useDeleteOutlet,
  useDepots,
  useDistricts,
  useUpdateCalendarDay,
  useUpdateDepot,
  useUpdateItem,
  useUpdateOutlet,
} from "@/api/master";
import type {
  CalendarDayCreatePayload,
  DepotPayload,
  ItemPayload,
  OutletPayload,
} from "@/api/master";
import { DeleteEntityDialog } from "./delete-entity-dialog";
import { EntityFormDialog, buildPayload } from "./entity-form-dialog";
import {
  DEPOT_FIELDS,
  ITEM_FIELDS,
  OUTLET_FIELDS,
  calendarFields,
  calendarValues,
  depotValues,
  itemValues,
  outletValues,
} from "../entity-forms";
import type { CalendarDay, MasterDepot, MasterItem, MasterOutlet } from "../types";

export type DialogState<T> =
  | { kind: "create"; seed?: Partial<T> }
  | { kind: "edit"; row: T }
  | { kind: "delete"; row: T }
  | null;

interface DialogsProps<T> {
  state: DialogState<T>;
  onClose: () => void;
}

export function ItemDialogs({ state, onClose }: DialogsProps<MasterItem>) {
  const { data: brands = [] } = useBrands();
  const create = useCreateItem();
  const update = useUpdateItem();
  const remove = useDeleteItem();
  if (!state) return null;
  if (state.kind === "delete")
    return (
      <DeleteEntityDialog
        label={`item ${state.row.sku}`}
        onClose={onClose}
        onConfirm={() => remove.mutateAsync(state.row.id)}
      />
    );
  const fields = ITEM_FIELDS(brands);
  const editing = state.kind === "edit";
  return (
    <EntityFormDialog
      title={editing ? "Edit item" : "Add item"}
      fields={fields}
      initial={itemValues(editing ? state.row : undefined)}
      onClose={onClose}
      onSubmit={(v) => {
        const payload = buildPayload<ItemPayload>(fields, v);
        return editing
          ? update.mutateAsync({ id: state.row.id, payload })
          : create.mutateAsync(payload);
      }}
    />
  );
}

export function OutletDialogs({ state, onClose }: DialogsProps<MasterOutlet>) {
  const { data: brands = [] } = useBrands();
  const { data: districts = [] } = useDistricts();
  const { data: depots = [] } = useDepots();
  const create = useCreateOutlet();
  const update = useUpdateOutlet();
  const remove = useDeleteOutlet();
  if (!state) return null;
  if (state.kind === "delete")
    return (
      <DeleteEntityDialog
        label={`outlet ${state.row.outlet_id}`}
        onClose={onClose}
        onConfirm={() => remove.mutateAsync(state.row.id)}
      />
    );
  const fields = OUTLET_FIELDS(brands, districts, depots);
  const editing = state.kind === "edit";
  return (
    <EntityFormDialog
      title={editing ? "Edit outlet" : "Add outlet"}
      fields={fields}
      initial={outletValues(editing ? state.row : undefined)}
      onClose={onClose}
      onSubmit={(v) => {
        const payload = buildPayload<OutletPayload>(fields, v);
        return editing
          ? update.mutateAsync({ id: state.row.id, payload })
          : create.mutateAsync(payload);
      }}
    />
  );
}

export function DepotDialogs({ state, onClose }: DialogsProps<MasterDepot>) {
  const create = useCreateDepot();
  const update = useUpdateDepot();
  const remove = useDeleteDepot();
  if (!state) return null;
  if (state.kind === "delete")
    return (
      <DeleteEntityDialog
        label={`depot ${state.row.name}`}
        onClose={onClose}
        onConfirm={() => remove.mutateAsync(state.row.id)}
      />
    );
  const editing = state.kind === "edit";
  return (
    <EntityFormDialog
      title={editing ? "Edit depot" : "Add depot"}
      fields={DEPOT_FIELDS}
      initial={depotValues(editing ? state.row : undefined)}
      onClose={onClose}
      onSubmit={(v) => {
        const payload = buildPayload<DepotPayload>(DEPOT_FIELDS, v);
        return editing
          ? update.mutateAsync({ id: state.row.id, payload })
          : create.mutateAsync(payload);
      }}
    />
  );
}

export function CalendarDialogs({ state, onClose }: DialogsProps<CalendarDay>) {
  const create = useCreateCalendarDay();
  const update = useUpdateCalendarDay();
  const remove = useDeleteCalendarDay();
  if (!state) return null;
  if (state.kind === "delete")
    return (
      <DeleteEntityDialog
        label={`calendar day ${state.row.date}`}
        onClose={onClose}
        onConfirm={() => remove.mutateAsync(state.row.date)}
      />
    );
  const editing = state.kind === "edit";
  const fields = calendarFields(editing).filter(
    (f) => editing || (f.name !== "is_payday" && f.name !== "is_operating")
  );
  const seed = state.kind === "create" ? state.seed : undefined;
  return (
    <EntityFormDialog
      title={editing ? "Edit calendar day" : "Add calendar day"}
      fields={fields}
      initial={{
        ...calendarValues(editing ? state.row : undefined),
        ...(seed?.date ? { date: seed.date } : {}),
      }}
      onClose={onClose}
      onSubmit={(v) =>
        editing
          ? update.mutateAsync({
              date: state.row.date,
              payload: buildPayload<CalendarDayCreatePayload>(fields, v),
            })
          : create.mutateAsync(buildPayload<CalendarDayCreatePayload>(fields, v))
      }
    />
  );
}
