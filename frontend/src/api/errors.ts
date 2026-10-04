export interface PydanticErrorItem {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

const ERROR_CODE_MAP: Record<string, string> = {
  // Auth & Account
  LOGIN_BAD_CREDENTIALS: "Invalid email or password.",
  LOGIN_USER_NOT_VERIFIED: "Your email address is not verified yet.",
  REGISTER_USER_ALREADY_EXISTS: "An account with this email address already exists.",
  RESET_PASSWORD_BAD_TOKEN: "The password reset token is invalid or has expired.",
  RESET_PASSWORD_INVALID_PASSWORD: "The password does not meet security requirements.",
  VERIFY_USER_BAD_TOKEN: "The verification token is invalid or has expired.",
  VERIFY_USER_ALREADY_VERIFIED: "This account is already verified.",
  UPDATE_USER_EMAIL_ALREADY_EXISTS: "This email address is already in use.",
  REFRESH_NOT_ALLOWED: "Your session has expired. Please sign in again.",

  // Logistics & Operations
  INVALID_CUTOFF_TIME: "The specified cutoff time is invalid for this delivery schedule.",
  TRIP_NOT_FOUND: "The requested trip could not be found.",
  TRIP_NOT_SCHEDULED: "This trip has not been scheduled yet.",
  TRIP_NOT_LOADING: "This trip is currently not in loading status.",
  TRIP_NOT_READY: "This trip is not ready for dispatch.",
  ORDER_NOT_FOUND: "The requested order could not be found.",
  ORDER_NOT_DEFERRABLE: "This order cannot be deferred in its current status.",
  DEFERRED_ORDER_NOT_FOUND: "Deferred order record was not found.",
  ITEM_NOT_FOUND: "The requested item was not found in the catalog.",
  CHECKLIST_ITEM_NOT_FOUND: "Checklist item was not found.",
  OUTLET_NOT_FOUND: "Outlet could not be found.",
  DEPOT_NOT_FOUND: "Depot could not be found.",
  DISTRICT_NOT_FOUND: "District could not be found.",
  BRAND_NOT_FOUND: "Brand could not be found.",
  PRICE_NOT_FOUND: "Price record could not be found.",
  DRIVER_NOT_FOUND: "Driver profile could not be found.",
  DRIVER_PROFILE_NOT_FOUND: "Driver profile could not be found.",
  VEHICLE_NOT_FOUND: "Vehicle could not be found in the fleet registry.",
  VEHICLE_ALREADY_EXISTS: "A vehicle with this registration or code already exists.",
  NO_ACTIVE_TRIP: "No active trip found for this driver.",
  WAYPOINT_CLOSED: "The destination waypoint is currently closed.",
  WAYPOINT_NOT_FOUND: "Waypoint location could not be found.",
  WAYPOINT_HAS_NO_ORDER: "This waypoint has no assigned orders.",
  UNVERIFIED_ITEMS: "Please verify all checklist items before continuing.",
  INVALID_ISSUE_TYPE: "Invalid delivery issue category specified.",
  INVALID_STATUS: "Invalid status transition for this entity.",
  OVERLAPPING_PRICE_WINDOW: "Price list date window overlaps with an existing schedule.",
  INVALID_EFFECTIVE_DATES: "Effective start date must precede or match the end date.",
  ORDER_NOT_ALLOCATABLE: "Only pending or deferred orders can be allocated.",
  DEPOT_MISMATCH: "The selected vehicle belongs to a different depot than the order.",
  MIXED_BRAND_OR_DISTRICT: "Selected orders must share the same brand and district.",
  VEHICLE_NOT_REEFER: "Chilled orders require a refrigerated vehicle.",
  VEHICLE_UNAVAILABLE: "The selected vehicle is not available.",
  VEHICLE_TRIP_LIMIT: "The selected vehicle has reached its trip limit for this date.",
  CAPACITY_EXCEEDED:
    "The orders exceed the selected vehicle's weight or volume capacity.",
  TELEMETRY_NOT_FOUND: "Vehicle telemetry data could not be found.",
};

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: "The request could not be processed. Please verify your inputs.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "A conflict occurred with the current state of the resource.",
  422: "Please verify that all submitted fields are valid.",
  429: "Too many requests. Please wait a moment before trying again.",
  500: "An internal server error occurred. Please try again later.",
  502: "Server gateway is temporarily unreachable.",
  503: "Service is temporarily unavailable. Please try again shortly.",
  504: "The server timed out waiting for a response.",
};

export function humanizeErrorCode(code: string): string {
  const trimmed = code.trim();
  if (ERROR_CODE_MAP[trimmed]) {
    return ERROR_CODE_MAP[trimmed];
  }

  // Handle generic UPPER_SNAKE_CASE codes (e.g. USER_NOT_FOUND -> "User not found.")
  if (/^[A-Z0-9_]+$/.test(trimmed) && trimmed.length > 2) {
    const words = trimmed.toLowerCase().split("_");
    const sentence = words.join(" ");
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
  }

  return trimmed;
}

function formatPydanticErrors(errors: unknown[]): string {
  const formatted: string[] = [];

  for (const item of errors) {
    if (typeof item === "string") {
      formatted.push(humanizeErrorCode(item));
      continue;
    }
    if (item && typeof item === "object") {
      const err = item as PydanticErrorItem;
      const field =
        err.loc && err.loc.length > 0 ? String(err.loc[err.loc.length - 1]) : null;
      const rawMsg = err.msg || "Invalid value";

      if (field && field !== "body" && field !== "__root__") {
        const cleanField = field
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        formatted.push(`${cleanField}: ${rawMsg}`);
      } else {
        formatted.push(rawMsg);
      }
    }
  }

  return formatted.length > 0 ? formatted.join("; ") : "Invalid input data.";
}

export function normalizeApiError(
  status?: number,
  data?: unknown,
  fallbackMessage?: string
): string {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if ("detail" in obj) {
      const detail = obj.detail;
      if (typeof detail === "string") {
        return humanizeErrorCode(detail);
      }
      if (Array.isArray(detail)) {
        return formatPydanticErrors(detail);
      }
      if (detail && typeof detail === "object") {
        return JSON.stringify(detail);
      }
    }

    if (typeof obj.message === "string" && obj.message.trim()) {
      return humanizeErrorCode(obj.message);
    }
    if (typeof obj.error === "string" && obj.error.trim()) {
      return humanizeErrorCode(obj.error);
    }
  }

  if (fallbackMessage && fallbackMessage.trim()) {
    return humanizeErrorCode(fallbackMessage);
  }

  if (status && HTTP_STATUS_MESSAGES[status]) {
    return HTTP_STATUS_MESSAGES[status];
  }

  return "An unexpected error occurred. Please try again.";
}

export function formatErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (!err) return fallback;

  if (typeof err === "string") {
    return humanizeErrorCode(err);
  }

  if (typeof err === "object" && err !== null) {
    if (err instanceof Error) {
      if (err.name === "ApiError") {
        const apiErr = err as Error & { status?: number; data?: unknown };
        return apiErr.message || normalizeApiError(apiErr.status, apiErr.data, fallback);
      }
      const msg = err.message || "";
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("Load failed") ||
        msg.includes("Network request failed")
      ) {
        return "Unable to connect to the server. Please check your network connection.";
      }
      return humanizeErrorCode(msg) || fallback;
    }

    return normalizeApiError(undefined, err, fallback);
  }

  return fallback;
}
