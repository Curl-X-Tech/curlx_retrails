import * as React from "react";
import { useOrderBuilder } from "../hooks/use-order-builder";
import type { OrderCatalog } from "../hooks/use-order-catalog";
import { OrderFormHeader } from "./order-form-header";
import { OrderFormDestination } from "./order-form-destination";
import { OrderFormCatalogSearch } from "./order-form-catalog-search";
import { OrderFormItemsTable } from "./order-form-items-table";
import { OrderFormItemsCards } from "./order-form-items-cards";
import { OrderFormSummaryStrip } from "./order-form-summary-strip";
import { OrderFormActionBar } from "./order-form-action-bar";
import { OrderFormPrintModal } from "./order-form-print-modal";
import { OrderFormSuccessModal } from "./order-form-success-modal";

export function OrderFormView({ catalog }: { catalog: OrderCatalog }) {
  const builder = useOrderBuilder(catalog);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        builder.handleConfirmOrder();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const addNextProduct = () => {
    if (builder.catalogProducts.length === 0) return;
    builder.handleAddProduct(
      builder.catalogProducts[builder.rows.length % builder.catalogProducts.length],
      10
    );
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
        <OrderFormHeader
          orderRef={builder.orderRef}
          hasRows={builder.rows.length > 0}
          onClearDraft={builder.handleClearDraft}
        />

        <OrderFormDestination
          selectedOutlet={builder.selectedOutlet}
          onSelectOutlet={builder.setSelectedOutlet}
          selectedDate={builder.selectedDate}
          onChangeDate={builder.setSelectedDate}
          isUrgent={builder.isUrgent}
          onToggleUrgent={builder.setIsUrgent}
          outletSearch={builder.outletSearch}
          onChangeOutletSearch={builder.setOutletSearch}
          filteredOutlets={builder.filteredOutlets}
        />

        <OrderFormCatalogSearch
          catalogSearch={builder.catalogSearch}
          onChangeCatalogSearch={builder.setCatalogSearch}
          isSearchingCatalog={builder.isSearchingCatalog}
          setIsSearchingCatalog={builder.setIsSearchingCatalog}
          searchResults={builder.searchResults}
          catalogProducts={builder.catalogProducts}
          onAddProduct={builder.handleAddProduct}
        />

        <div className="space-y-3">
          <OrderFormItemsTable
            rows={builder.rows}
            catalogProducts={builder.catalogProducts}
            selectedRowIds={builder.selectedRowIds}
            hasColdChain={builder.hasColdChain}
            onToggleSelectAll={builder.toggleSelectAllRows}
            onToggleSelectRow={builder.toggleSelectRow}
            onUpdateProduct={builder.handleUpdateProduct}
            onUpdateQuantity={builder.handleUpdateQuantity}
            onRemoveRow={builder.handleRemoveRow}
            onAddRow={addNextProduct}
          />

          <OrderFormItemsCards
            rows={builder.rows}
            onUpdateQuantity={builder.handleUpdateQuantity}
            onRemoveRow={builder.handleRemoveRow}
            onAddRow={addNextProduct}
          />
        </div>

        <OrderFormSummaryStrip
          totalItems={builder.totalItems}
          totalUnits={builder.totalUnits}
          totalWeightKg={builder.totalWeightKg}
          totalVolumeM3={builder.totalVolumeM3}
          totalOrderValueLkr={builder.totalOrderValueLkr}
        />
      </div>

      <OrderFormActionBar
        isSubmitting={builder.isSubmitting}
        hasRows={builder.rows.length > 0}
        onOpenPrintPreview={() => builder.setShowPrintPreview(true)}
        onConfirmOrder={builder.handleConfirmOrder}
      />

      <OrderFormPrintModal
        isOpen={builder.showPrintPreview}
        onOpenChange={builder.setShowPrintPreview}
        orderRef={builder.orderRef}
        selectedOutlet={builder.selectedOutlet}
        selectedDate={builder.selectedDate}
        rows={builder.rows}
        totalWeightKg={builder.totalWeightKg}
        totalOrderValueLkr={builder.totalOrderValueLkr}
      />

      <OrderFormSuccessModal
        isOpen={builder.showSuccessModal}
        onOpenChange={builder.setShowSuccessModal}
        orderRef={builder.orderRef}
        selectedOutlet={builder.selectedOutlet}
        selectedDate={builder.selectedDate}
        totalWeightKg={builder.totalWeightKg}
        totalOrderValueLkr={builder.totalOrderValueLkr}
        onCreateAnother={() => {
          builder.setShowSuccessModal(false);
          builder.setRows([]);
        }}
      />
    </>
  );
}
