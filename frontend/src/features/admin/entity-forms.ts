import type { FieldSpec, FormValues } from "./components/entity-form-dialog";
import type {
  CalendarDay,
  MasterBrand,
  MasterDepot,
  MasterDistrict,
  MasterItem,
  MasterOutlet,
} from "./types";

const yesNo = (v: boolean | null | undefined) => Boolean(v);
const text = (v: string | number | null | undefined) => (v == null ? "" : String(v));

export const ITEM_FIELDS = (brands: MasterBrand[]): FieldSpec[] => [
  { name: "sku", label: "SKU", type: "text", required: true },
  { name: "name", label: "Product name", type: "text", required: true },
  {
    name: "brand_id",
    label: "Brand",
    type: "select",
    required: true,
    options: brands.map((b) => ({ value: b.id, label: b.name })),
  },
  { name: "category", label: "Category", type: "text", required: true },
  { name: "unit", label: "Unit", type: "text" },
  {
    name: "unit_weight_kg",
    label: "Unit weight (kg)",
    type: "number",
    required: true,
    step: "0.01",
    min: "0",
  },
  {
    name: "unit_volume_m3",
    label: "Unit volume (m3)",
    type: "number",
    required: true,
    step: "0.001",
    min: "0",
  },
  {
    name: "special_handling_code",
    label: "Special handling",
    type: "select",
    options: [
      { value: "COL", label: "COL - Cold chain" },
      { value: "FRG", label: "FRG - Fragile" },
      { value: "MAL", label: "MAL - Mall bay" },
      { value: "HAZ", label: "HAZ - Hazardous" },
    ],
  },
  { name: "requires_cold_chain", label: "Requires cold chain", type: "checkbox" },
];

export const itemValues = (i?: MasterItem): FormValues => ({
  sku: text(i?.sku),
  name: text(i?.name),
  brand_id: text(i?.brand_id),
  category: text(i?.category),
  unit: text(i?.unit ?? "unit"),
  unit_weight_kg: text(i?.unit_weight_kg),
  unit_volume_m3: text(i?.unit_volume_m3),
  special_handling_code: text(i?.special_handling_code),
  requires_cold_chain: yesNo(i?.requires_cold_chain),
});

export const OUTLET_FIELDS = (
  brands: MasterBrand[],
  districts: MasterDistrict[],
  depots: MasterDepot[]
): FieldSpec[] => [
  { name: "outlet_id", label: "Outlet ID", type: "text", required: true },
  { name: "name", label: "Store name", type: "text", required: true },
  {
    name: "brand_id",
    label: "Brand",
    type: "select",
    required: true,
    options: brands.map((b) => ({ value: b.id, label: b.name })),
  },
  {
    name: "district_id",
    label: "District",
    type: "select",
    required: true,
    options: districts.map((d) => ({ value: d.id, label: d.name })),
  },
  {
    name: "depot_id",
    label: "Depot",
    type: "select",
    required: true,
    options: depots.map((d) => ({ value: d.id, label: d.name })),
  },
  {
    name: "dock_type",
    label: "Dock type",
    type: "select",
    required: true,
    options: [
      { value: "rear_dock", label: "Rear dock" },
      { value: "street", label: "Street" },
      { value: "mall_bay", label: "Mall bay" },
    ],
  },
  {
    name: "parking_constraint",
    label: "Parking constraint",
    type: "select",
    required: true,
    options: [
      { value: "normal", label: "Normal" },
      { value: "van_only", label: "Van only" },
      { value: "mall_dock", label: "Mall dock" },
    ],
  },
  { name: "window_open_time", label: "Window opens", type: "time", required: true },
  { name: "window_close_time", label: "Window closes", type: "time", required: true },
  { name: "latitude", label: "Latitude", type: "number", step: "any" },
  { name: "longitude", label: "Longitude", type: "number", step: "any" },
  { name: "contact_phone", label: "Contact phone", type: "text" },
  { name: "is_active", label: "Active", type: "checkbox" },
];

export const outletValues = (o?: MasterOutlet): FormValues => ({
  outlet_id: text(o?.outlet_id),
  name: text(o?.name),
  brand_id: text(o?.brand_id),
  district_id: text(o?.district_id),
  depot_id: text(o?.depot_id),
  dock_type: text(o?.dock_type ?? "rear_dock"),
  parking_constraint: text(o?.parking_constraint ?? "normal"),
  window_open_time: text(o?.window_open_time?.slice(0, 5) ?? "08:00"),
  window_close_time: text(o?.window_close_time?.slice(0, 5) ?? "18:00"),
  latitude: text(o?.latitude),
  longitude: text(o?.longitude),
  contact_phone: text(o?.contact_phone),
  is_active: o ? o.is_active : true,
});

export const DEPOT_FIELDS: FieldSpec[] = [
  { name: "code", label: "Code", type: "text", required: true },
  { name: "name", label: "Name", type: "text", required: true },
  { name: "latitude", label: "Latitude", type: "number", required: true, step: "any" },
  { name: "longitude", label: "Longitude", type: "number", required: true, step: "any" },
  { name: "address", label: "Address", type: "text" },
  { name: "is_active", label: "Active", type: "checkbox" },
];

export const depotValues = (d?: MasterDepot): FormValues => ({
  code: text(d?.code),
  name: text(d?.name),
  latitude: text(d?.latitude),
  longitude: text(d?.longitude),
  address: text(d?.address),
  is_active: d ? d.is_active : true,
});

export const calendarFields = (editing: boolean): FieldSpec[] => [
  { name: "date", label: "Date", type: "date", required: true, disabled: editing },
  { name: "festival", label: "Festival", type: "text" },
  {
    name: "festival_ramp",
    label: "Festival ramp (0 to 1)",
    type: "number",
    step: "0.1",
    min: "0",
    max: "1",
  },
  { name: "is_holiday", label: "Holiday", type: "checkbox" },
  { name: "is_payday", label: "Payday", type: "checkbox" },
  { name: "monsoon", label: "Monsoon", type: "checkbox" },
  { name: "is_operating", label: "Operating day", type: "checkbox" },
];

export const calendarValues = (d?: CalendarDay): FormValues => ({
  date: text(d?.date),
  festival: text(d?.festival),
  festival_ramp: text(d?.festival_ramp ?? 0),
  is_holiday: yesNo(d?.is_holiday),
  is_payday: yesNo(d?.is_payday),
  monsoon: yesNo(d?.monsoon),
  is_operating: d ? d.is_operating : true,
});
