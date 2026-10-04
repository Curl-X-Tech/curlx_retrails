import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import {
  arriveWaypointMock as recordArrivalMock,
  logDiscrepancyMock,
  submitPodMock,
} from "./mock";
import type {
  ArriveRequest,
  DiscrepancyReport,
  LogDiscrepancyRequest,
  ProofOfDelivery,
  SubmitPodRequest,
} from "./types";

export async function recordArrival(
  waypointId: string,
  payload: ArriveRequest
): Promise<{ success: boolean; waypoint_id: string; status: string }> {
  const ep = ENDPOINTS.deliveriesArrive;
  if (
    shouldUseMock(ep.domain, ep.status) ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return recordArrivalMock(waypointId, payload);
  }
  try {
    const path = ep.path.replace("{waypoint_id}", encodeURIComponent(waypointId));
    return await apiClient<{ success: boolean; waypoint_id: string; status: string }>(
      path,
      {
        method: ep.method,
        body: payload as unknown as Record<string, unknown>,
      }
    );
  } catch {
    return recordArrivalMock(waypointId, payload);
  }
}

export async function submitPod(
  waypointId: string,
  payload: SubmitPodRequest
): Promise<ProofOfDelivery> {
  const ep = ENDPOINTS.deliveriesPod;
  if (
    shouldUseMock(ep.domain, ep.status) ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return submitPodMock(waypointId, payload);
  }
  try {
    const path = ep.path.replace("{waypoint_id}", encodeURIComponent(waypointId));
    return await apiClient<ProofOfDelivery>(path, {
      method: ep.method,
      body: payload as unknown as Record<string, unknown>,
    });
  } catch {
    return submitPodMock(waypointId, payload);
  }
}

export async function logDiscrepancy(
  waypointId: string,
  payload: LogDiscrepancyRequest
): Promise<DiscrepancyReport> {
  const ep = ENDPOINTS.deliveriesDiscrepancy;
  if (
    shouldUseMock(ep.domain, ep.status) ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return logDiscrepancyMock(waypointId, payload);
  }
  try {
    const path = ep.path.replace("{waypoint_id}", encodeURIComponent(waypointId));
    return await apiClient<DiscrepancyReport>(path, {
      method: ep.method,
      body: payload as unknown as Record<string, unknown>,
    });
  } catch {
    return logDiscrepancyMock(waypointId, payload);
  }
}

export async function uploadPodImage(
  dataUrlOrFile: string | Blob | File
): Promise<{ file_url: string; key: string }> {
  try {
    let file: Blob;
    if (typeof dataUrlOrFile === "string") {
      if (dataUrlOrFile.startsWith("data:")) {
        const parts = dataUrlOrFile.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        file = new Blob([u8arr], { type: mime });
      } else {
        return { file_url: dataUrlOrFile, key: dataUrlOrFile };
      }
    } else {
      file = dataUrlOrFile;
    }

    const formData = new FormData();
    formData.append(
      "file",
      file,
      `pod_${Date.now()}.${file.type.includes("png") ? "png" : "jpg"}`
    );

    const ep = ENDPOINTS.deliveriesUploadPod;
    return await apiClient<{ file_url: string; key: string }>(ep.path, {
      method: ep.method,
      body: formData,
    });
  } catch {
    const key = `local-pod-${Date.now()}`;
    const stringVal =
      typeof dataUrlOrFile === "string"
        ? dataUrlOrFile
        : URL.createObjectURL(dataUrlOrFile);
    return { file_url: stringVal, key };
  }
}
