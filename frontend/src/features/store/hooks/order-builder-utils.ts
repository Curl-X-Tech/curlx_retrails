import { CATALOG_PRODUCTS } from "@/data/mock-store-orders";
import type { CatalogProduct, StoreOrderItemRow } from "../types";

export const DRAFT_STORAGE_KEY = "retrails_store_draft_order";

export const INITIAL_ORDER_ROWS: StoreOrderItemRow[] = [
  {
    id: "row-1",
    productId: CATALOG_PRODUCTS[0].id,
    sku: CATALOG_PRODUCTS[0].sku,
    name: CATALOG_PRODUCTS[0].name,
    category: CATALOG_PRODUCTS[0].category,
    unit: CATALOG_PRODUCTS[0].unit,
    quantity: 10,
    unitWeightKg: CATALOG_PRODUCTS[0].unitWeightKg,
    unitVolumeM3: CATALOG_PRODUCTS[0].unitVolumeM3,
    unitPriceLkr: CATALOG_PRODUCTS[0].unitPriceLkr,
    totalWeightKg: CATALOG_PRODUCTS[0].unitWeightKg * 10,
    totalVolumeM3: CATALOG_PRODUCTS[0].unitVolumeM3 * 10,
    totalPriceLkr: CATALOG_PRODUCTS[0].unitPriceLkr * 10,
    specialHandlingCode: CATALOG_PRODUCTS[0].specialHandlingCode,
  },
  {
    id: "row-2",
    productId: CATALOG_PRODUCTS[1].id,
    sku: CATALOG_PRODUCTS[1].sku,
    name: CATALOG_PRODUCTS[1].name,
    category: CATALOG_PRODUCTS[1].category,
    unit: CATALOG_PRODUCTS[1].unit,
    quantity: 8,
    unitWeightKg: CATALOG_PRODUCTS[1].unitWeightKg,
    unitVolumeM3: CATALOG_PRODUCTS[1].unitVolumeM3,
    unitPriceLkr: CATALOG_PRODUCTS[1].unitPriceLkr,
    totalWeightKg: CATALOG_PRODUCTS[1].unitWeightKg * 8,
    totalVolumeM3: CATALOG_PRODUCTS[1].unitVolumeM3 * 8,
    totalPriceLkr: CATALOG_PRODUCTS[1].unitPriceLkr * 8,
    specialHandlingCode: CATALOG_PRODUCTS[1].specialHandlingCode,
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

export function createNewOrderRow(product: CatalogProduct, qty: number): StoreOrderItemRow {
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

export function updateRowWithProduct(row: StoreOrderItemRow, product: CatalogProduct): StoreOrderItemRow {
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

export function updateRowQuantityVal(row: StoreOrderItemRow, qty: number): StoreOrderItemRow {
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
