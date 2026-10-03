import * as React from "react";
import { createStoreOrder } from "@/data/mock-store-orders";
import type { CatalogProduct, StoreOrderItemRow, StoreOutletOption } from "../types";
import type { OrderCatalog } from "./use-order-catalog";
import {
  DRAFT_STORAGE_KEY,
  loadSavedDraftRows,
  saveDraftRows,
  createNewOrderRow,
  updateRowWithProduct,
  updateRowQuantityVal,
  calculateOrderMetrics,
} from "./order-builder-utils";

const matches = (query: string, ...fields: string[]) =>
  fields.some((f) => f.toLowerCase().includes(query.toLowerCase()));

export function useOrderBuilder({
  outlets,
  products,
}: Pick<OrderCatalog, "outlets" | "products">) {
  const [orderRef] = React.useState(
    () => `ORD-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [selectedOutlet, setSelectedOutlet] = React.useState<StoreOutletOption>(
    outlets[0]
  );
  const [selectedDate, setSelectedDate] = React.useState<string>("2026-10-02");
  const [isUrgent, setIsUrgent] = React.useState<boolean>(false);
  const [outletSearch, setOutletSearch] = React.useState<string>("");
  const [catalogSearch, setCatalogSearch] = React.useState<string>("");
  const [isSearchingCatalog, setIsSearchingCatalog] = React.useState<boolean>(false);
  const [rows, setRows] = React.useState<StoreOrderItemRow[]>(() => loadSavedDraftRows());
  const [selectedRowIds, setSelectedRowIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = React.useState<boolean>(false);

  React.useEffect(() => {
    saveDraftRows(rows);
  }, [rows]);

  const handleUpdateQuantity = (rowId: string, qty: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? updateRowQuantityVal(r, qty) : r))
    );
  };

  const handleAddProduct = (product: CatalogProduct, qty: number = 10) => {
    const idx = rows.findIndex((r) => r.productId === product.id);
    if (idx >= 0) handleUpdateQuantity(rows[idx].id, rows[idx].quantity + qty);
    else setRows((prev) => [...prev, createNewOrderRow(product, qty)]);
    setCatalogSearch("");
    setIsSearchingCatalog(false);
  };

  const handleUpdateProduct = (rowId: string, product: CatalogProduct) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? updateRowWithProduct(r, product) : r))
    );
  };

  const handleRemoveRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setSelectedRowIds((prev) => prev.filter((id) => id !== rowId));
  };

  const handleClearDraft = () => {
    setRows([]);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const toggleSelectAllRows = () => {
    const all = rows.length > 0 && rows.every((r) => selectedRowIds.includes(r.id));
    setSelectedRowIds(all ? [] : rows.map((r) => r.id));
  };

  const toggleSelectRow = (rowId: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  const metrics = calculateOrderMetrics(rows);

  const handleConfirmOrder = () => {
    if (rows.length === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      createStoreOrder({
        orderRef,
        outletId: selectedOutlet.id,
        outletName: selectedOutlet.name,
        outletAddress: selectedOutlet.address,
        district: selectedOutlet.district,
        depot: selectedOutlet.depot,
        orderDate: new Date().toISOString().split("T")[0],
        requiredDate: selectedDate,
        tempRequirement: metrics.hasColdChain ? "chilled" : "ambient",
        status: "pending",
        isUrgent,
        ...metrics,
        items: rows,
      });
      setIsSubmitting(false);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setShowSuccessModal(true);
    }, 400);
  };

  return {
    orderRef,
    selectedOutlet,
    setSelectedOutlet,
    selectedDate,
    setSelectedDate,
    isUrgent,
    setIsUrgent,
    outletSearch,
    setOutletSearch,
    filteredOutlets: outlets.filter((o) =>
      matches(outletSearch, o.name, o.district, o.code)
    ),
    catalogSearch,
    setCatalogSearch,
    isSearchingCatalog,
    setIsSearchingCatalog,
    searchResults: products.filter((p) =>
      matches(catalogSearch, p.name, p.sku, p.category)
    ),
    catalogProducts: products,
    rows,
    setRows,
    selectedRowIds,
    isSubmitting,
    showSuccessModal,
    setShowSuccessModal,
    showPrintPreview,
    setShowPrintPreview,
    ...metrics,
    handleAddProduct,
    handleUpdateProduct,
    handleUpdateQuantity,
    handleRemoveRow,
    handleClearDraft,
    toggleSelectAllRows,
    toggleSelectRow,
    handleConfirmOrder,
  };
}
