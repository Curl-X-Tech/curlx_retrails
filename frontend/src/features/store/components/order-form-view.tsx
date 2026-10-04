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
import { OrderFormSuccessModal } from "./order-form-success-modal";
import { OrderPlacementDialog } from "./order-placement-dialog";

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
      <OrderFormHeader
        orderRef={builder.orderRef}
        hasRows={builder.rows.length > 0}
        onClearDraft={builder.handleClearDraft}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar / Waypoint, Delivery Date, Order Stats (25% width on desktop, sticky on left) */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-0 lg:self-start">
            <OrderFormDestination
              selectedOutlet={builder.selectedOutlet}
              onSelectOutlet={builder.setSelectedOutlet}
              selectedDate={builder.selectedDate}
              minDeliveryDate={builder.minDeliveryDate}
              onChangeDate={builder.setSelectedDate}
              outletSearch={builder.outletSearch}
              onChangeOutletSearch={builder.setOutletSearch}
              filteredOutlets={builder.filteredOutlets}
            />

            <OrderFormSummaryStrip
              totalItems={builder.totalItems}
              totalUnits={builder.totalUnits}
              totalWeightKg={builder.totalWeightKg}
              totalVolumeM3={builder.totalVolumeM3}
              totalOrderValueLkr={builder.totalOrderValueLkr}
            />
          </div>

          {/* Main / Catalog Search & Items Table (75% width on desktop) */}
          <div className="lg:col-span-3 space-y-4">
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
                hasColdChain={builder.hasColdChain}
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
          </div>
        </div>
      </div>

      {builder.submitError && (
        <p className="px-4 md:px-8 py-2 text-xs font-medium text-red-600 bg-card border-t border-border">
          {builder.submitError}
        </p>
      )}

      <OrderPlacementDialog
        stage={builder.placementStage}
        nextDate={builder.nextOrderDate}
        onSchedule={builder.handleScheduleNextDay}
        onCancel={() => builder.setPlacementStage(null)}
      />

      <OrderFormActionBar
        isSubmitting={builder.isSubmitting}
        hasRows={builder.rows.length > 0}
        isUrgent={builder.isUrgent}
        onToggleUrgent={builder.setIsUrgent}
        onPrintDraft={builder.handlePrintDraft}
        onConfirmOrder={builder.handleConfirmOrder}
      />

      <OrderFormSuccessModal
        isOpen={builder.showSuccessModal}
        onOpenChange={builder.setShowSuccessModal}
        orderRef={builder.orderRef}
        selectedOutlet={builder.selectedOutlet}
        selectedDate={builder.selectedDate}
        rows={builder.rows}
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
