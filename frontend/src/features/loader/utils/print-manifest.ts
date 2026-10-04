import type { LoaderVehicleTrip } from "../types";

export function printManifestWaybill(trip: LoaderVehicleTrip): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const totalCrates = trip.waypoints.reduce(
    (acc, wp) => acc + wp.items.reduce((sum, i) => sum + i.crateCount, 0),
    0
  );
  const totalWeight = trip.waypoints.reduce(
    (acc, wp) => acc + wp.items.reduce((sum, i) => sum + i.weightKg, 0),
    0
  );
  const totalVolume = trip.waypoints.reduce(
    (acc, wp) => acc + wp.items.reduce((sum, i) => sum + i.volumeM3, 0),
    0
  );

  const currentDateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const waypointsHtml = trip.waypoints
    .map(
      (wp) => `
      <div class="drop-block">
        <div class="drop-header">
          <div>
            <span class="drop-badge">DROP #${wp.seq}</span>
            <strong>${wp.outletName}</strong> (${wp.outletCode})
          </div>
          <div class="drop-meta">
            ${wp.items.reduce((s, i) => s + i.crateCount, 0)} Crates · ${wp.items.reduce((s, i) => s + i.weightKg, 0)} kg
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">Package / Box ID</th>
              <th style="width: 35%;">Item Description</th>
              <th style="width: 15%;">Staging Bay</th>
              <th style="width: 10%; text-align: right;">Crates</th>
              <th style="width: 10%; text-align: right;">Weight</th>
              <th style="width: 10%; text-align: center;">Verified</th>
            </tr>
          </thead>
          <tbody>
            ${wp.items
              .map(
                (item) => `
              <tr>
                <td><strong>${item.packageCode}</strong></td>
                <td>${item.itemTitle}</td>
                <td>${item.stagingBay}</td>
                <td style="text-align: right; font-weight: bold;">${item.crateCount}</td>
                <td style="text-align: right;">${item.weightKg} kg</td>
                <td style="text-align: center;">[ X ]</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Waybill_${trip.tripCode}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #000000;
      background: #ffffff;
    }
    body {
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 600;
      color: #333;
      margin-top: 2px;
    }
    .brand-depot {
      font-size: 10px;
      color: #444;
      margin-top: 1px;
    }
    .manifest-meta {
      text-align: right;
    }
    .manifest-code {
      font-size: 16px;
      font-weight: 900;
    }
    .meta-line {
      font-size: 10px;
      color: #333;
      margin-top: 2px;
    }
    .vehicle-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      border: 1px solid #999;
      padding: 6px 10px;
      margin-bottom: 14px;
    }
    .v-item span {
      display: block;
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #555;
    }
    .v-item strong {
      font-size: 11px;
      font-weight: 700;
    }
    .section-heading {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 3px;
    }
    .drop-block {
      border: 1px solid #888;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .drop-header {
      background: #f0f0f0;
      padding: 4px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #888;
      font-size: 10.5px;
    }
    .drop-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      margin-right: 6px;
    }
    .drop-meta {
      font-size: 10px;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }
    th {
      background: #fafafa;
      text-align: left;
      padding: 4px 8px;
      border-bottom: 1px solid #aaa;
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
    }
    td {
      padding: 4px 8px;
      border-bottom: 1px solid #eee;
    }
    .summary-bar {
      display: flex;
      justify-content: space-between;
      border: 1px solid #000;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 800;
      margin-top: 12px;
      page-break-inside: avoid;
    }
    .summary-metrics {
      display: flex;
      gap: 16px;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #888;
      page-break-inside: avoid;
    }
    .sig-col {
      display: flex;
      flex-col;
    }
    .sig-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #333;
    }
    .sig-line {
      border-bottom: 1px solid #000;
      margin-top: 36px;
      padding-bottom: 2px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">RETRAILS LOGISTICS</div>
      <div class="brand-sub">Vehicle Loading & Dispatch Verification Waybill</div>
      <div class="brand-depot">Depot: ${trip.depotName} · Bay: ${trip.dockBay}</div>
    </div>
    <div class="manifest-meta">
      <div class="manifest-code">MANIFEST #${trip.tripCode}</div>
      <div class="meta-line">Date: ${trip.dispatchDate || currentDateStr}</div>
      <div class="meta-line">Planned Rollout: ${trip.plannedDepartureTime}</div>
    </div>
  </div>

  <div class="vehicle-grid">
    <div class="v-item">
      <span>Vehicle Reg</span>
      <strong>${trip.regNumber}</strong>
    </div>
    <div class="v-item">
      <span>Fleet Model</span>
      <strong>${trip.modelName}</strong>
    </div>
    <div class="v-item">
      <span>Assigned Driver</span>
      <strong>${trip.driver.name}</strong>
    </div>
    <div class="v-item">
      <span>Cargo Class</span>
      <strong>${trip.temp === "reefer" ? "COLD CHAIN (REEFER)" : "AMBIENT DRY"}</strong>
    </div>
  </div>

  <div class="section-heading">Loading Sequence & Crate Allocation (Reverse Delivery Order)</div>
  ${waypointsHtml}

  <div class="summary-bar">
    <span>TOTAL VEHICLE PAYLOAD ALLOCATION</span>
    <div class="summary-metrics">
      <span>${totalCrates} Crates</span>
      <span>${totalWeight.toLocaleString()} kg</span>
      <span>${totalVolume.toFixed(2)} m³</span>
    </div>
  </div>

  <div class="signatures-grid">
    <div class="sig-col">
      <div class="sig-title">Dock Loader Verification</div>
      <div class="sig-line">
        <span>Signature: ____________________</span>
        <span>Date: ${currentDateStr}</span>
      </div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Driver Acceptance</div>
      <div class="sig-line">
        <span>Driver: ${trip.driver.name}</span>
        <span>Seal #: ${trip.sealNumber}</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 250);
}
