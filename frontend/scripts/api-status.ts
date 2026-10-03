import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ENDPOINT_LIST } from "../src/api/endpoints";

const docsPath = resolve(import.meta.dir, "../../docs/api-status.md");

function formatRoles(roles: readonly string[]): string {
  return roles.length > 0 ? roles.join(", ") : "public";
}

function formatOffline(offline: boolean): string {
  return offline ? "yes" : "no";
}

function formatUi(ui: boolean): string {
  return ui ? "yes" : "no";
}

const rows = ENDPOINT_LIST.map((endpoint) =>
  [
    endpoint.domain,
    endpoint.method,
    endpoint.path,
    formatRoles(endpoint.roles),
    formatOffline(endpoint.offline),
    endpoint.status,
    formatUi(endpoint.ui),
  ].join(" | ")
);

const liveCount = ENDPOINT_LIST.filter((endpoint) => endpoint.status === "live").length;
const pendingCount = ENDPOINT_LIST.filter((endpoint) => endpoint.status === "pending").length;

const content = [
  "# API Status",
  "",
  `Live: ${liveCount} | Pending: ${pendingCount} | Total: ${ENDPOINT_LIST.length}`,
  "",
  "| domain | method | path | roles | offline | status | ui consumer |",
  "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
  ...rows.map((row) => `| ${row} |`),
  "",
].join("\n");

await mkdir(resolve(import.meta.dir, "../../docs"), { recursive: true });
await writeFile(docsPath, content, "utf8");