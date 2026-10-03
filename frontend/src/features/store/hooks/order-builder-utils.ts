import type { CatalogProduct, StoreOrderItemRow } from "../types";

export const DRAFT_STORAGE_KEY = "retrails_store_draft_order";

export const INITIAL_ORDER_ROWS: StoreOrderItemRow[] = [
  {
    id: "row-1",
    productId: "prod-01",
    sku: "SKU-MLK-01",
    name: "Farm Fresh Chilled Full Cream Milk (1L x 24)",
    category: "Dairy & Chilled",
    unit: "Crate",
    quantity: 10,
    unitWeightKg: 25.5,
    unitVolumeM3: 0.18,
    unitPriceLkr: 11500,
    totalWeightKg: 255.0,
    totalVolumeM3: 1.8,
    totalPriceLkr: 115000,
    specialHandlingCode: "COL",
  },
  {
    id: "row-2",
    productId: "prod-02",
    sku: "SKU-BTR-02",
    name: "Highland Butter Blocks Salted (250g x 40)",
    category: "Dairy & Chilled",
    unit: "Box",
    quantity: 8,
    unitWeightKg: 10.5,
    unitVolumeM3: 0.07,
    unitPriceLkr: 14200,
    totalWeightKg: 84.0,
    totalVolumeM3: 0.56,
    totalPriceLkr: 113600,
    specialHandlingCode: "COL",
  },
];

export function loadSavedDraftRows(): StoreOrderItemRow[] {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_ORDER_ROWS;
}

export function saveDraftRows(rows: StoreOrderItemRow[]): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ignore
  }
}

export function createNewOrderRow(
  product: CatalogProduct,
  qty: number
): StoreOrderItemRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    unit: product.unit,
    quantity: qty,
    unitWeightKg: product.unitWeightKg,
    unitVolumeM3: product.unitVolumeM3,
    unitPriceLkr: product.unitPriceLkr,
    totalWeightKg: Number((product.unitWeightKg * qty).toFixed(2)),
    totalVolumeM3: Number((product.unitVolumeM3 * qty).toFixed(4)),
    totalPriceLkr: product.unitPriceLkr * qty,
    specialHandlingCode: product.specialHandlingCode,
  };
}

export function updateRowWithProduct(
  row: StoreOrderItemRow,
  product: CatalogProduct
): StoreOrderItemRow {
  return {
    ...row,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    unit: product.unit,
    unitWeightKg: product.unitWeightKg,
    unitVolumeM3: product.unitVolumeM3,
    unitPriceLkr: product.unitPriceLkr,
    totalWeightKg: Number((product.unitWeightKg * row.quantity).toFixed(2)),
    totalVolumeM3: Number((product.unitVolumeM3 * row.quantity).toFixed(4)),
    totalPriceLkr: product.unitPriceLkr * row.quantity,
    specialHandlingCode: product.specialHandlingCode,
  };
}

export function updateRowQuantityVal(
  row: StoreOrderItemRow,
  qty: number
): StoreOrderItemRow {
  const safeQty = Math.max(1, qty);
  return {
    ...row,
    quantity: safeQty,
    totalWeightKg: Number((row.unitWeightKg * safeQty).toFixed(2)),
    totalVolumeM3: Number((row.unitVolumeM3 * safeQty).toFixed(4)),
    totalPriceLkr: row.unitPriceLkr * safeQty,
  };
}

export function calculateOrderMetrics(rows: StoreOrderItemRow[]) {
  return {
    totalItems: rows.length,
    totalUnits: rows.reduce((sum, r) => sum + r.quantity, 0),
    totalWeightKg: rows.reduce((sum, r) => sum + r.totalWeightKg, 0),
    totalVolumeM3: rows.reduce((sum, r) => sum + r.totalVolumeM3, 0),
    totalOrderValueLkr: rows.reduce((sum, r) => sum + r.totalPriceLkr, 0),
    hasColdChain: rows.some((r) => r.specialHandlingCode === "COL"),
  };
}
