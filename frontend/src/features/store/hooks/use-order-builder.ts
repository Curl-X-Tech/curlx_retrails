import * as React from "react";
import { useCreateOrder } from "@/api/orders";
import {
  getTodayColomboDate,
  getEarliestDeliveryDate,
  isPastCutoff,
} from "@/lib/business-day";
import { printInvoice } from "../print-invoice";
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

export type PlacementStage = "received" | "cutoff" | "placing" | "placed" | null;

const STEP_DELAY_MS = 900;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const matches = (query: string, ...fields: string[]) =>
  fields.some((f) => f.toLowerCase().includes(query.toLowerCase()));

export function useOrderBuilder({
  outlets,
  products,
}: Pick<OrderCatalog, "outlets" | "products">) {
  const [createdOrderRef, setCreatedOrderRef] = React.useState<string>("");
  const [orderRef] = React.useState(
    () => `ORD-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [selectedOutlet, setSelectedOutlet] = React.useState<StoreOutletOption>(
    outlets[0]
  );
  const [selectedDate, setSelectedDate] = React.useState<string>(() =>
    getTodayColomboDate()
  );
  const [isUrgent, setIsUrgent] = React.useState<boolean>(false);
  const [outletSearch, setOutletSearch] = React.useState<string>("");
  const [catalogSearch, setCatalogSearch] = React.useState<string>("");
  const [isSearchingCatalog, setIsSearchingCatalog] = React.useState<boolean>(false);
  const [rows, setRows] = React.useState<StoreOrderItemRow[]>(() => {
    return loadSavedDraftRows();
  });
  const [selectedRowIds, setSelectedRowIds] = React.useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = React.useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = React.useState<boolean>(false);
  const [placementStage, setPlacementStage] = React.useState<PlacementStage>(null);
  const [submitError, setSubmitError] = React.useState<string>("");

  const createOrderMutation = useCreateOrder();

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

  const submitOrder = async (orderDate: string) => {
    if (rows.length === 0 || !selectedOutlet) return;
    setSubmitError("");
    setPlacementStage("placing");
    try {
      const created = await createOrderMutation.mutateAsync({
        outlet_id: selectedOutlet.id,
        order_date: orderDate,
        required_date: orderDate,
        temp_requirement: metrics.hasColdChain ? "chilled" : "ambient",
        is_urgent: isUrgent,
        items: rows.map((r) => ({
          item_id: r.productId,
          requested_qty: r.quantity,
          special_handling_code: r.specialHandlingCode,
        })),
      });
      setSelectedDate(orderDate);
      setCreatedOrderRef(created.order_ref);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setPlacementStage("placed");
      await wait(STEP_DELAY_MS);
      setPlacementStage(null);
      setShowSuccessModal(true);
    } catch (err) {
      setPlacementStage(null);
      if (!navigator.onLine) {
        setCreatedOrderRef(orderRef);
        setShowSuccessModal(true);
        return;
      }
      setSubmitError(err instanceof Error ? err.message : "Failed to place the order.");
    }
  };

  const handleConfirmOrder = async () => {
    if (rows.length === 0 || !selectedOutlet) return;
    if (!selectedDate || selectedDate < getTodayColomboDate()) {
      setSubmitError("Delivery date cannot be in the past.");
      return;
    }
    setSubmitError("");
    setPlacementStage("received");
    await wait(STEP_DELAY_MS);
    if (isPastCutoff() && selectedDate <= getTodayColomboDate()) {
      setPlacementStage("cutoff");
      return;
    }
    await submitOrder(selectedDate);
  };

  const handlePrintDraft = () => {
    if (!selectedOutlet || rows.length === 0) return;
    printInvoice({
      orderRef: createdOrderRef || orderRef,
      outlet: selectedOutlet,
      deliveryDate: selectedDate,
      rows,
      totalWeightKg: metrics.totalWeightKg,
      totalOrderValueLkr: metrics.totalOrderValueLkr,
    });
  };

  const handleScheduleNextDay = () => submitOrder(getEarliestDeliveryDate());

  return {
    orderRef: createdOrderRef || orderRef,
    selectedOutlet,
    setSelectedOutlet,
    selectedDate,
    setSelectedDate,
    minDeliveryDate: getTodayColomboDate(),
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
    isSubmitting: createOrderMutation.isPending,
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
    handlePrintDraft,
    placementStage,
    setPlacementStage,
    handleScheduleNextDay,
    nextOrderDate: getEarliestDeliveryDate(),
    submitError,
  };
}
