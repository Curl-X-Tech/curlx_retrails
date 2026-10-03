import * as React from "react";
import { CATALOG_PRODUCTS, STORE_OUTLETS, createStoreOrder } from "@/data/mock-store-orders";
import type { CatalogProduct, StoreOrderItemRow, StoreOutletOption } from "../types";
import {
  DRAFT_STORAGE_KEY,
  loadSavedDraftRows,
  saveDraftRows,
  createNewOrderRow,
  updateRowWithProduct,
  updateRowQuantityVal,
  calculateOrderMetrics,
} from "./order-builder-utils";

export function useOrderBuilder() {
  const [orderRef] = React.useState(() => `ORD-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [selectedOutlet, setSelectedOutlet] = React.useState<StoreOutletOption>(STORE_OUTLETS[0]);
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

  const handleAddProduct = (product: CatalogProduct, qty: number = 10) => {
    const existingIndex = rows.findIndex((r) => r.productId === product.id);
    if (existingIndex >= 0) {
      handleUpdateQuantity(rows[existingIndex].id, rows[existingIndex].quantity + qty);
    } else {
      setRows((prev) => [...prev, createNewOrderRow(product, qty)]);
    }
    setCatalogSearch("");
    setIsSearchingCatalog(false);
  };

  const handleUpdateProduct = (rowId: string, product: CatalogProduct) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? updateRowWithProduct(r, product) : r)));
  };

  const handleUpdateQuantity = (rowId: string, qty: number) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? updateRowQuantityVal(r, qty) : r)));
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
    const allSelected = rows.length > 0 && rows.every((r) => selectedRowIds.includes(r.id));
    setSelectedRowIds(allSelected ? [] : rows.map((r) => r.id));
  };

  const toggleSelectRow = (rowId: string) => {
    setSelectedRowIds((prev) => (prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]));
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

  const filteredOutlets = STORE_OUTLETS.filter(
    (o) =>
      o.name.toLowerCase().includes(outletSearch.toLowerCase()) ||
      o.district.toLowerCase().includes(outletSearch.toLowerCase()) ||
      o.code.toLowerCase().includes(outletSearch.toLowerCase())
  );

  const searchResults = CATALOG_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

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
    filteredOutlets,
    catalogSearch,
    setCatalogSearch,
    isSearchingCatalog,
    setIsSearchingCatalog,
    searchResults,
    catalogProducts: CATALOG_PRODUCTS,
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
