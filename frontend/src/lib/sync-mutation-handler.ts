import { type MutationRecord } from "./dexie-db";
import { getStoredToken } from "./api";

export async function syncSingleMutation(mutation: MutationRecord): Promise<void> {
  const token = getStoredToken();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  let endpoint = "";
  if (mutation.actionType === "ARRIVE_STOP" || mutation.actionType === "COMPLETE_STOP") {
    endpoint = `/trips/${mutation.tripId}/stops/${mutation.payload.seq}`;
  } else if (mutation.actionType === "VERIFY_ITEM") {
    endpoint = `/trips/${mutation.tripId}/items/${mutation.payload.packageCode}`;
  } else if (mutation.actionType === "RECORD_BREAK") {
    endpoint = `/trips/${mutation.tripId}/break`;
  } else if (mutation.actionType === "TELEMETRY_PING") {
    endpoint = `/fleet/telemetry/report`;
  }

  if (!endpoint) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(mutation.payload),
    });

    if (res.status === 404 || res.status === 405) {
      return;
    }

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw error;
    }
  }
}
