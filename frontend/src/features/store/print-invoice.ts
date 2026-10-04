import type { StoreOrderItemRow, StoreOutletOption } from "./types";

interface InvoiceData {
  orderRef: string;
  outlet: Pick<StoreOutletOption, "name" | "code" | "district" | "depot">;
  deliveryDate: string;
  rows: StoreOrderItemRow[];
  totalWeightKg: number;
  totalOrderValueLkr: number;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const lkr = (n: number) =>
  n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STYLES = `
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; margin: 0; }
  header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 12px; }
  h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: 1px; }
  .meta { text-align: right; line-height: 1.6; }
  .parties { display: flex; gap: 24px; margin: 18px 0; }
  .parties div { flex: 1; line-height: 1.6; }
  .label { font-size: 10px; text-transform: uppercase; color: #555; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #111; padding: 6px 4px; }
  td { padding: 6px 4px; border-bottom: 1px solid #ddd; }
  .num { text-align: right; }
  tr { page-break-inside: avoid; }
  .totals { margin: 16px 0 0 auto; width: 260px; line-height: 1.8; }
  .totals div { display: flex; justify-content: space-between; }
  .grand { border-top: 2px solid #111; font-weight: bold; font-size: 14px; margin-top: 4px; padding-top: 4px; }
  .signatures { display: flex; gap: 40px; margin-top: 60px; }
  .signatures div { flex: 1; border-top: 1px solid #111; padding-top: 4px; font-size: 10px; }
`;

function buildInvoiceHtml(data: InvoiceData): string {
  const { orderRef, outlet, deliveryDate, rows, totalWeightKg, totalOrderValueLkr } =
    data;
  const lines = rows
    .map(
      (r, i) => `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.sku)}</td>
        <td>${escapeHtml(r.name)}</td>
        <td class="num">${r.quantity} ${escapeHtml(r.unit)}</td>
        <td class="num">${lkr(r.unitPriceLkr)}</td>
        <td class="num">${lkr(r.totalPriceLkr)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(orderRef)}</title><style>${STYLES}</style></head><body>
    <header>
      <div><h1>INVOICE</h1><div>ReTrails Distribution</div></div>
      <div class="meta">
        <div><b>Order Ref:</b> ${escapeHtml(orderRef)}</div>
        <div><b>Issued:</b> ${new Date().toLocaleDateString("en-CA")}</div>
        <div><b>Delivery Date:</b> ${escapeHtml(deliveryDate)}</div>
      </div>
    </header>
    <section class="parties">
      <div><div class="label">Deliver To</div><b>${escapeHtml(outlet.name)}</b><br>Outlet ${escapeHtml(outlet.code)}<br>${escapeHtml(outlet.district)}</div>
      <div><div class="label">Dispatched From</div><b>${escapeHtml(outlet.depot)} Distribution Center</b></div>
    </section>
    <table>
      <thead><tr><th>#</th><th>SKU</th><th>Description</th><th class="num">Qty</th><th class="num">Unit Price (LKR)</th><th class="num">Amount (LKR)</th></tr></thead>
      <tbody>${lines}</tbody>
    </table>
    <section class="totals">
      <div><span>Total Items</span><span>${rows.length}</span></div>
      <div><span>Gross Weight</span><span>${totalWeightKg.toFixed(1)} kg</span></div>
      <div class="grand"><span>Total (LKR)</span><span>${lkr(totalOrderValueLkr)}</span></div>
    </section>
    <section class="signatures"><div>Prepared by</div><div>Driver</div><div>Received by (Store)</div></section>
  </body></html>`;
}

export function printInvoice(data: InvoiceData): void {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(buildInvoiceHtml(data));
  doc.close();

  win.onafterprint = () => frame.remove();
  win.focus();
  win.print();
}
