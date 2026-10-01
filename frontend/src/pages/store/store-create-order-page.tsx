import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  PrinterIcon,
  CheckCircleIcon,
  CalendarBlankIcon,
  StorefrontIcon,
  CaretDownIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  CATALOG_PRODUCTS,
  STORE_OUTLETS,
  createStoreOrder,
  type CatalogProduct,
  type StoreOrderItemRow,
  type StoreOutletOption,
} from "@/data/mock-store-orders";

export function StoreCreateOrderPage() {
  const navigate = useNavigate();

  // Header generated draft reference
  const [orderRef] = React.useState<string>(
    () => `ORD-2026-${Math.floor(100 + Math.random() * 900)}`
  );

  // Destination and Date selection
  const [selectedOutlet, setSelectedOutlet] = React.useState<StoreOutletOption>(
    STORE_OUTLETS[0]
  );
  const [selectedDate, setSelectedDate] = React.useState<string>("2026-10-02");
  const [isUrgent, setIsUrgent] = React.useState<boolean>(false);

  // Line items state
  const [rows, setRows] = React.useState<StoreOrderItemRow[]>([
    {
      id: "row-1",
      productId: CATALOG_PRODUCTS[0].id,
      sku: CATALOG_PRODUCTS[0].sku,
      name: CATALOG_PRODUCTS[0].name,
      category: CATALOG_PRODUCTS[0].category,
      unit: CATALOG_PRODUCTS[0].unit,
      quantity: 200,
      unitWeightKg: CATALOG_PRODUCTS[0].unitWeightKg,
      unitVolumeM3: CATALOG_PRODUCTS[0].unitVolumeM3,
      unitPriceLkr: CATALOG_PRODUCTS[0].unitPriceLkr,
      totalWeightKg: CATALOG_PRODUCTS[0].unitWeightKg * 200,
      totalVolumeM3: CATALOG_PRODUCTS[0].unitVolumeM3 * 200,
      totalPriceLkr: CATALOG_PRODUCTS[0].unitPriceLkr * 200,
      specialHandlingCode: CATALOG_PRODUCTS[0].specialHandlingCode,
    },
  ]);

  const [selectedRowIds, setSelectedRowIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState<boolean>(false);
  const [outletSearch, setOutletSearch] = React.useState<string>("");

  // Add new empty row
  const handleAddRow = (presetProduct?: CatalogProduct) => {
    const product =
      presetProduct || CATALOG_PRODUCTS[rows.length % CATALOG_PRODUCTS.length];
    const newRowId = `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newRow: StoreOrderItemRow = {
      id: newRowId,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: 10,
      unitWeightKg: product.unitWeightKg,
      unitVolumeM3: product.unitVolumeM3,
      unitPriceLkr: product.unitPriceLkr,
      totalWeightKg: product.unitWeightKg * 10,
      totalVolumeM3: product.unitVolumeM3 * 10,
      totalPriceLkr: product.unitPriceLkr * 10,
      specialHandlingCode: product.specialHandlingCode,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleUpdateProduct = (rowId: string, product: CatalogProduct) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          productId: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          unit: product.unit,
          unitWeightKg: product.unitWeightKg,
          unitVolumeM3: product.unitVolumeM3,
          unitPriceLkr: product.unitPriceLkr,
          totalWeightKg: Number((product.unitWeightKg * r.quantity).toFixed(2)),
          totalVolumeM3: Number((product.unitVolumeM3 * r.quantity).toFixed(4)),
          totalPriceLkr: product.unitPriceLkr * r.quantity,
          specialHandlingCode: product.specialHandlingCode,
        };
      })
    );
  };

  const handleUpdateQuantity = (rowId: string, qty: number) => {
    const safeQty = Math.max(1, qty);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          quantity: safeQty,
          totalWeightKg: Number((r.unitWeightKg * safeQty).toFixed(2)),
          totalVolumeM3: Number((r.unitVolumeM3 * safeQty).toFixed(4)),
          totalPriceLkr: r.unitPriceLkr * safeQty,
        };
      })
    );
  };

  const handleUpdateUnit = (rowId: string, unit: string) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, unit } : r)));
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setSelectedRowIds((prev) => prev.filter((id) => id !== rowId));
  };

  const allRowsSelected =
    rows.length > 0 && rows.every((r) => selectedRowIds.includes(r.id));
  const toggleSelectAllRows = () => {
    if (allRowsSelected) setSelectedRowIds([]);
    else setSelectedRowIds(rows.map((r) => r.id));
  };

  const toggleSelectRow = (rowId: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // Calculations
  const totalItems = rows.length;
  const totalUnits = rows.reduce((sum, r) => sum + r.quantity, 0);
  const totalWeightKg = rows.reduce((sum, r) => sum + r.totalWeightKg, 0);
  const totalVolumeM3 = rows.reduce((sum, r) => sum + r.totalVolumeM3, 0);
  const totalOrderValueLkr = rows.reduce((sum, r) => sum + r.totalPriceLkr, 0);
  const hasColdChain = rows.some((r) => r.specialHandlingCode === "COL");

  const handleConfirmOrder = () => {
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
        tempRequirement: hasColdChain ? "chilled" : "ambient",
        status: "pending",
        isUrgent,
        totalItems,
        totalUnits,
        totalWeightKg,
        totalVolumeM3,
        totalOrderValueLkr,
        items: rows,
      });
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 400);
  };

  const filteredOutlets = STORE_OUTLETS.filter(
    (o) =>
      o.name.toLowerCase().includes(outletSearch.toLowerCase()) ||
      o.district.toLowerCase().includes(outletSearch.toLowerCase()) ||
      o.code.toLowerCase().includes(outletSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background font-sans">
      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Page Title & Context Header matching Reference 2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
                Create New Order
              </h1>
              <Badge
                variant="outline"
                className="text-xs font-semibold px-2 py-0.5 border-primary/30 text-primary"
              >
                Draft #{orderRef}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Compose outlet line items, select target fulfillment depot, and dispatch
              manifest request
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/store/orders")}
            className="self-start sm:self-auto text-xs gap-1.5 rounded-xl border-border hover:bg-muted/40 cursor-pointer"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Orders
          </Button>
        </div>

        {/* Top Destination & Date Selectors matching Reference 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Destination Location Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <StorefrontIcon className="size-4 text-primary" />
              Destination Location
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 border border-border text-left transition-colors cursor-pointer outline-none"
                  />
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MagnifyingGlassIcon className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {selectedOutlet.name} ({selectedOutlet.code})
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedOutlet.address} •{" "}
                      {selectedOutlet.dockType.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <CaretDownIcon className="size-4 text-muted-foreground shrink-0 ml-2" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[340px] sm:w-[420px] p-2 text-xs shadow-lg rounded-xl"
              >
                <div className="p-1 mb-1">
                  <Input
                    placeholder="Search outlets or districts..."
                    value={outletSearch}
                    onChange={(e) => setOutletSearch(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="max-h-56 overflow-y-auto space-y-1">
                  {filteredOutlets.map((outlet) => (
                    <DropdownMenuItem
                      key={outlet.id}
                      onClick={() => setSelectedOutlet(outlet)}
                      className="p-2 rounded-lg cursor-pointer flex flex-col items-start gap-0.5"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-foreground">
                          {outlet.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {outlet.depot}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {outlet.address} • {outlet.district}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Delivery Date Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CalendarBlankIcon className="size-4 text-primary" />
              Delivery Date
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 h-12 text-xs rounded-xl bg-muted/40 border-border font-medium cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <label className="text-[11px] text-muted-foreground flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="size-3.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                />
                <span>Priority Order Flag</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Items Table Section matching Reference 2 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground">
              Order Items ({rows.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRow()}
                className="h-8 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
              >
                <PlusIcon className="size-3.5 font-bold" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Desktop & Tablet Table */}
          <div className="hidden sm:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 px-3">
                    <input
                      type="checkbox"
                      checked={allRowsSelected}
                      onChange={toggleSelectAllRows}
                      className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground min-w-[240px]">
                    Item
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground w-28">
                    unit
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground w-28 text-right">
                    Qnt
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground w-32 text-right">
                    Unit Price
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground w-28 text-right">
                    Weight
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground w-36 text-right">
                    Subtotal (LKR)
                  </TableHead>
                  <TableHead className="w-12 text-right pr-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isChecked = selectedRowIds.includes(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Checkbox */}
                      <TableCell className="px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(row.id)}
                          className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                        />
                      </TableCell>

                      {/* Item Selector */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                              />
                            }
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                                  {row.name}
                                </span>
                                {row.specialHandlingCode && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-700 dark:text-amber-300"
                                  >
                                    {row.specialHandlingCode}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {row.sku} • {row.category}
                              </span>
                            </div>
                            <CaretDownIcon className="size-3.5 text-muted-foreground shrink-0" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-[320px] p-2 text-xs shadow-lg rounded-xl"
                          >
                            <DropdownMenuLabel className="text-xs text-muted-foreground px-2">
                              Select Catalog Item
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {CATALOG_PRODUCTS.map((prod) => (
                                <DropdownMenuItem
                                  key={prod.id}
                                  onClick={() => handleUpdateProduct(row.id, prod)}
                                  className="p-2 rounded-lg cursor-pointer flex flex-col items-start gap-0.5"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-semibold text-foreground truncate">
                                      {prod.name}
                                    </span>
                                    {prod.specialHandlingCode && (
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] px-1 h-3.5"
                                      >
                                        {prod.specialHandlingCode}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between w-full text-[11px] text-muted-foreground">
                                    <span>
                                      {prod.sku} • {prod.category}
                                    </span>
                                    <span className="font-medium text-foreground">
                                      LKR {prod.unitPriceLkr.toLocaleString()}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {/* Unit */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className="px-2.5 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border text-xs font-medium text-foreground flex items-center justify-between w-full cursor-pointer"
                              />
                            }
                          >
                            <span>{row.unit}</span>
                            <CaretDownIcon className="size-3 text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-28 text-xs shadow-md rounded-lg"
                          >
                            {["Crate", "Box", "Nos", "Pack", "Kg"].map((u) => (
                              <DropdownMenuItem
                                key={u}
                                onClick={() => handleUpdateUnit(row.id, u)}
                              >
                                {u}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              row.id,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="h-8 w-20 text-right text-xs rounded-lg bg-muted/30 border-border font-semibold ml-auto"
                        />
                      </TableCell>

                      {/* Unit Price */}
                      <TableCell className="text-right text-xs text-muted-foreground font-medium">
                        LKR {row.unitPriceLkr.toLocaleString()}
                      </TableCell>

                      {/* Weight */}
                      <TableCell className="text-right text-xs text-muted-foreground font-medium">
                        {row.totalWeightKg.toFixed(1)} kg
                      </TableCell>

                      {/* Subtotal */}
                      <TableCell className="text-right text-xs font-bold text-foreground">
                        LKR {row.totalPriceLkr.toLocaleString()}
                      </TableCell>

                      {/* Delete */}
                      <TableCell className="text-right pr-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={rows.length <= 1}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 cursor-pointer"
                          title="Remove item"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Circular + Button strictly matching Reference 2 */}
            <div className="py-3 bg-muted/10 border-t border-border/50 flex justify-center">
              <button
                type="button"
                onClick={() => handleAddRow()}
                className="size-8 rounded-full bg-[#0080FF] hover:bg-[#0070E0] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Add New Row"
              >
                <PlusIcon className="size-4 font-bold" />
              </button>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {rows.map((row) => (
              <Card
                key={row.id}
                className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-foreground truncate">
                      {row.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {row.sku} • {row.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={rows.length <= 1}
                    className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px]">Qty:</span>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(row.id, row.quantity - 1)}
                        className="px-2 py-1 bg-muted/40 hover:bg-muted text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-semibold text-xs bg-background">
                        {row.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(row.id, row.quantity + 1)}
                        className="px-2 py-1 bg-muted/40 hover:bg-muted text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-muted-foreground text-[11px]">{row.unit}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">
                      {row.totalWeightKg.toFixed(1)} kg
                    </span>
                    <span className="font-bold text-xs text-foreground">
                      LKR {row.totalPriceLkr.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}

            {/* Mobile Add Item Button */}
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => handleAddRow()}
                className="w-full py-2.5 text-xs gap-2 rounded-xl border-dashed border-primary/40 text-primary font-semibold"
              >
                <PlusIcon className="size-4" />
                Add Another Item
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground block font-medium">
              Total Line Items
            </span>
            <span className="text-base font-bold text-foreground">
              {totalItems} ({totalUnits} units)
            </span>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground block font-medium">
              Gross Weight
            </span>
            <span className="text-base font-bold text-foreground">
              {totalWeightKg.toFixed(1)} kg
            </span>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground block font-medium">
              Cargo Volume
            </span>
            <span className="text-base font-bold text-foreground">
              {totalVolumeM3.toFixed(2)} m³
            </span>
          </div>
          <div className="p-3 rounded-xl border border-border bg-primary/5 shadow-xs border-primary/20">
            <span className="text-[11px] text-primary block font-semibold">
              Total Order Valuation
            </span>
            <span className="text-base font-extrabold text-primary">
              LKR {totalOrderValueLkr.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar matching Reference 2 */}
      <div className="border-t border-border bg-card px-4 md:px-8 py-3.5 shrink-0 flex items-center justify-between gap-3 shadow-lg">
        {/* Left Print Button */}
        <Button
          variant="outline"
          size="default"
          onClick={() => window.print()}
          className="h-10 px-4 text-xs font-semibold gap-2 rounded-xl border-border hover:bg-muted/50 cursor-pointer"
        >
          <PrinterIcon className="size-4 text-muted-foreground" />
          <span>Print</span>
        </Button>

        {/* Right Confirm Button */}
        <Button
          size="default"
          disabled={isSubmitting || rows.length === 0}
          onClick={handleConfirmOrder}
          className="h-10 px-6 text-xs font-bold gap-2 rounded-xl bg-[#0080FF] hover:bg-[#0070E0] text-white shadow-md cursor-pointer transition-all active:scale-95"
        >
          <CheckCircleIcon className="size-4 font-bold" />
          <span>{isSubmitting ? "Submitting..." : "Confirm"}</span>
        </Button>
      </div>

      {/* Order Confirmation Success Sheet/Modal */}
      <Sheet open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <SheetContent
          side="bottom"
          className="sm:max-w-lg mx-auto rounded-t-2xl p-6 bg-card border-t border-border"
        >
          <SheetHeader className="text-center space-y-2">
            <div className="size-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircleIcon className="size-7" weight="bold" />
            </div>
            <SheetTitle className="text-xl font-bold text-foreground">
              Order Confirmed & Queued!
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Order <span className="font-semibold text-foreground">{orderRef}</span> has
              been dispatched to {selectedOutlet.depot} Distribution Center for
              allocation.
            </SheetDescription>
          </SheetHeader>

          <div className="my-6 p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outlet:</span>
              <span className="font-semibold text-foreground">{selectedOutlet.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Date:</span>
              <span className="font-semibold text-foreground">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Weight:</span>
              <span className="font-semibold text-foreground">
                {totalWeightKg.toFixed(1)} kg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valuation:</span>
              <span className="font-bold text-primary">
                LKR {totalOrderValueLkr.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                setRows([
                  {
                    id: "row-1",
                    productId: CATALOG_PRODUCTS[0].id,
                    sku: CATALOG_PRODUCTS[0].sku,
                    name: CATALOG_PRODUCTS[0].name,
                    category: CATALOG_PRODUCTS[0].category,
                    unit: CATALOG_PRODUCTS[0].unit,
                    quantity: 50,
                    unitWeightKg: CATALOG_PRODUCTS[0].unitWeightKg,
                    unitVolumeM3: CATALOG_PRODUCTS[0].unitVolumeM3,
                    unitPriceLkr: CATALOG_PRODUCTS[0].unitPriceLkr,
                    totalWeightKg: CATALOG_PRODUCTS[0].unitWeightKg * 50,
                    totalVolumeM3: CATALOG_PRODUCTS[0].unitVolumeM3 * 50,
                    totalPriceLkr: CATALOG_PRODUCTS[0].unitPriceLkr * 50,
                    specialHandlingCode: CATALOG_PRODUCTS[0].specialHandlingCode,
                  },
                ]);
              }}
              className="flex-1 rounded-xl text-xs"
            >
              Create Another
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/store/orders");
              }}
              className="flex-1 rounded-xl text-xs bg-primary text-primary-foreground font-semibold"
            >
              View in Queue
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
