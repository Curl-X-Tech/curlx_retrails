import * as React from "react";
import { useLogDiscrepancy, useSubmitPod } from "@/api/deliveries";
import type { InboundShipment, ReceivingCheckItem, ReceivingKPIs } from "../types";

const INITIAL_INBOUND_SHIPMENTS: InboundShipment[] = [
  {
    id: "SHP-20261004-001",
    orderId: "ord-101",
    waypointId: "wp-101",
    orderRef: "ORD-20261004-7F89B1",
    tripId: "TRIP-20261004-COL-01",
    vehicleNo: "WP-CAD-8821",
    driverName: "Sunil Perera",
    driverPhone: "+94 77 123 4567",
    outletName: "Waypoint Fresh - Colombo 03",
    outletAddress: "128 Galle Road, Kollupitiya",
    tempRequirement: "chilled",
    reeferTempC: 3.2,
    eta: "10:45 AM",
    status: "docked",
    totalPackages: 42,
    totalWeightKg: 520.0,
    totalValueLkr: 345000,
    items: [
      {
        id: "item-101-1",
        productId: "p1",
        sku: "DAIRY-001",
        name: "Farm Fresh Chilled Full Cream Milk (1L x 24)",
        category: "Dairy & Chilled",
        unit: "Crate",
        quantity: 20,
        unitWeightKg: 25.5,
        unitVolumeM3: 0.04,
        unitPriceLkr: 11500,
        totalWeightKg: 510.0,
        totalVolumeM3: 0.8,
        totalPriceLkr: 230000,
        specialHandlingCode: "COL",
      },
      {
        id: "item-101-2",
        productId: "p2",
        sku: "DAIRY-002",
        name: "Highland Butter Blocks Salted (250g x 40)",
        category: "Dairy & Chilled",
        unit: "Box",
        quantity: 10,
        unitWeightKg: 10.5,
        unitVolumeM3: 0.02,
        unitPriceLkr: 14200,
        totalWeightKg: 105.0,
        totalVolumeM3: 0.2,
        totalPriceLkr: 142000,
        specialHandlingCode: "COL",
      },
      {
        id: "item-101-3",
        productId: "p3",
        sku: "CHILLED-003",
        name: "Elephant House Ice Cream Vanilla (4L Tub x 4)",
        category: "Frozen Foods",
        unit: "Carton",
        quantity: 12,
        unitWeightKg: 16.0,
        unitVolumeM3: 0.05,
        unitPriceLkr: 9800,
        totalWeightKg: 192.0,
        totalVolumeM3: 0.6,
        totalPriceLkr: 117600,
        specialHandlingCode: "COL",
      },
    ],
  },
  {
    id: "SHP-20261004-002",
    orderId: "ord-102",
    waypointId: "wp-102",
    orderRef: "ORD-20261004-9E4C12",
    tripId: "TRIP-20261004-COL-02",
    vehicleNo: "WP-LH-4412",
    driverName: "Kamal Jayawardena",
    driverPhone: "+94 71 987 6543",
    outletName: "Waypoint Fresh - Colombo 03",
    outletAddress: "128 Galle Road, Kollupitiya",
    tempRequirement: "ambient",
    eta: "11:30 AM",
    status: "in_transit",
    totalPackages: 55,
    totalWeightKg: 680.0,
    totalValueLkr: 289500,
    items: [
      {
        id: "item-102-1",
        productId: "p4",
        sku: "DRY-001",
        name: "Prima Special Wheat Flour (1kg x 20)",
        category: "Dry Groceries",
        unit: "Bag",
        quantity: 25,
        unitWeightKg: 20.0,
        unitVolumeM3: 0.03,
        unitPriceLkr: 5800,
        totalWeightKg: 500.0,
        totalVolumeM3: 0.75,
        totalPriceLkr: 145000,
      },
      {
        id: "item-102-2",
        productId: "p5",
        sku: "DRY-002",
        name: "Munchee Super Cream Cracker (500g x 24)",
        category: "Bakery & Biscuits",
        unit: "Box",
        quantity: 30,
        unitWeightKg: 12.0,
        unitVolumeM3: 0.04,
        unitPriceLkr: 4800,
        totalWeightKg: 360.0,
        totalVolumeM3: 1.2,
        totalPriceLkr: 144000,
      },
    ],
  },
  {
    id: "SHP-20261004-003",
    orderId: "ord-103",
    waypointId: "wp-103",
    orderRef: "ORD-20261004-3B18F9",
    tripId: "TRIP-20261004-COL-01",
    vehicleNo: "WP-CAD-8821",
    driverName: "Sunil Perera",
    driverPhone: "+94 77 123 4567",
    outletName: "Waypoint Fresh - Colombo 03",
    outletAddress: "128 Galle Road, Kollupitiya",
    tempRequirement: "chilled",
    reeferTempC: 4.1,
    eta: "08:15 AM",
    status: "delivered",
    totalPackages: 18,
    totalWeightKg: 210.0,
    totalValueLkr: 165000,
    deliveredAt: "08:32 AM",
    cratesReturned: 14,
    items: [
      {
        id: "item-103-1",
        productId: "p6",
        sku: "PROD-001",
        name: "Organic Baby Spinach Prepack (250g x 20)",
        category: "Fresh Produce",
        unit: "Crate",
        quantity: 18,
        unitWeightKg: 5.5,
        unitVolumeM3: 0.03,
        unitPriceLkr: 9150,
        totalWeightKg: 99.0,
        totalVolumeM3: 0.54,
        totalPriceLkr: 164700,
        specialHandlingCode: "COL",
      },
    ],
  },
];

export interface InboundFilterOptions {
  searchQuery?: string;
  statusFilter?: string;
  tempFilter?: string;
}

export function useStoreReceiving() {
  const [shipments, setShipments] = React.useState<InboundShipment[]>(
    INITIAL_INBOUND_SHIPMENTS
  );
  const [activeShipment, setActiveShipment] = React.useState<InboundShipment | null>(
    null
  );
  const [isReceivingModalOpen, setIsReceivingModalOpen] = React.useState(false);

  const logDiscrepancyMutation = useLogDiscrepancy();
  const submitPodMutation = useSubmitPod();

  const kpis: ReceivingKPIs = React.useMemo(() => {
    return {
      inboundTrucksCount: shipments.filter((s) => s.status !== "delivered").length,
      pendingReceivalCount: shipments.filter(
        (s) => s.status === "in_transit" || s.status === "docked"
      ).length,
      coldChainRunsCount: shipments.filter((s) => s.tempRequirement === "chilled").length,
      discrepanciesCount: shipments.filter((s) => s.status === "discrepancy").length,
      cratesReturnedTotal: shipments.reduce((sum, s) => sum + (s.cratesReturned || 0), 0),
    };
  }, [shipments]);

  const openInspection = React.useCallback((shipment: InboundShipment) => {
    setActiveShipment(shipment);
    setIsReceivingModalOpen(true);
  }, []);

  const closeInspection = React.useCallback(() => {
    setActiveShipment(null);
    setIsReceivingModalOpen(false);
  }, []);

  const confirmReceiving = React.useCallback(
    async ({
      shipmentId,
      waypointId,
      items,
      cratesReturned,
      recipientName,
      signatureDataUrl,
    }: {
      shipmentId: string;
      waypointId: string;
      items: ReceivingCheckItem[];
      cratesReturned: number;
      recipientName: string;
      signatureDataUrl?: string;
    }) => {
      const discrepanciesToLog = items.filter(
        (item) => item.issueType && item.requestedQty > item.receivedQty
      );

      const hasDiscrepancy = discrepanciesToLog.length > 0;
      const now = new Date().toISOString();

      try {
        if (hasDiscrepancy) {
          for (const d of discrepanciesToLog) {
            await logDiscrepancyMutation.mutateAsync({
              waypointId,
              payload: {
                item_id: d.itemId,
                issue_type: d.issueType!,
                reported_qty: d.requestedQty - d.receivedQty,
                notes: d.notes,
              },
            });
          }
        }

        await submitPodMutation.mutateAsync({
          waypointId,
          payload: {
            recipient_name: recipientName,
            signature_data_url:
              signatureDataUrl || "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
            arrived_at: now,
            completed_at: now,
            discrepancies: discrepanciesToLog.map((d) => ({
              item_id: d.itemId,
              issue_type: d.issueType!,
              reported_qty: d.requestedQty - d.receivedQty,
              notes: d.notes,
            })),
          },
        });
      } catch {
        // Continue UI status update even on offline / mock fallback
      }

      setShipments((prev) =>
        prev.map((s) => {
          if (s.id !== shipmentId) return s;
          return {
            ...s,
            status: hasDiscrepancy ? "discrepancy" : "delivered",
            deliveredAt: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            cratesReturned,
          };
        })
      );

      closeInspection();
    },
    [logDiscrepancyMutation, submitPodMutation, closeInspection]
  );

  const getFilteredShipments = React.useCallback(
    (filters: InboundFilterOptions) => {
      const { searchQuery = "", statusFilter = "all", tempFilter = "all" } = filters;
      return shipments.filter((s) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchRef = s.orderRef.toLowerCase().includes(q);
          const matchTrip = s.tripId.toLowerCase().includes(q);
          const matchVehicle = s.vehicleNo.toLowerCase().includes(q);
          const matchDriver = s.driverName.toLowerCase().includes(q);
          if (!matchRef && !matchTrip && !matchVehicle && !matchDriver) return false;
        }
        if (statusFilter !== "all" && s.status !== statusFilter) {
          return false;
        }
        if (tempFilter !== "all" && s.tempRequirement !== tempFilter) {
          return false;
        }
        return true;
      });
    },
    [shipments]
  );

  return {
    shipments,
    activeShipment,
    isReceivingModalOpen,
    kpis,
    openInspection,
    closeInspection,
    confirmReceiving,
    getFilteredShipments,
    isSubmitting: logDiscrepancyMutation.isPending || submitPodMutation.isPending,
  };
}
