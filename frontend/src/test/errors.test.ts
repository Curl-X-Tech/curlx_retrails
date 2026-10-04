import { describe, it, expect } from "vitest";
import { formatErrorMessage, humanizeErrorCode, normalizeApiError } from "@/api/errors";
import { ApiError } from "@/api/client";

describe("Error Normalization and Formatting", () => {
  it("formats known auth error codes into proper messages", () => {
    expect(humanizeErrorCode("LOGIN_BAD_CREDENTIALS")).toBe("Invalid email or password.");
    expect(humanizeErrorCode("LOGIN_USER_NOT_VERIFIED")).toBe(
      "Your email address is not verified yet."
    );
    expect(humanizeErrorCode("RESET_PASSWORD_BAD_TOKEN")).toBe(
      "The password reset token is invalid or has expired."
    );
  });

  it("humanizes arbitrary upper snake case codes", () => {
    expect(humanizeErrorCode("UNKNOWN_SERVICE_ERROR")).toBe("Unknown service error.");
    expect(humanizeErrorCode("RATE_LIMIT_EXCEEDED")).toBe("Rate limit exceeded.");
  });

  it("formats pydantic validation errors from FastAPI into readable sentences", () => {
    const pydanticErrors = [
      {
        loc: ["body", "email"],
        msg: "value is not a valid email address",
        type: "value_error",
      },
    ];
    const message = normalizeApiError(422, { detail: pydanticErrors });
    expect(message).toBe("Email: value is not a valid email address");
  });

  it("handles HTTP status codes when no body detail is provided", () => {
    expect(normalizeApiError(401)).toBe(
      "Your session has expired. Please sign in again."
    );
    expect(normalizeApiError(404)).toBe("The requested resource was not found.");
    expect(normalizeApiError(500)).toBe(
      "An internal server error occurred. Please try again later."
    );
  });

  it("formats ApiError instances directly", () => {
    const apiErr = new ApiError(400, "Invalid email or password.", {
      detail: "LOGIN_BAD_CREDENTIALS",
    });
    expect(formatErrorMessage(apiErr)).toBe("Invalid email or password.");
  });

  it("formats network / fetch failures", () => {
    const netErr = new TypeError("Failed to fetch");
    expect(formatErrorMessage(netErr)).toBe(
      "Unable to connect to the server. Please check your network connection."
    );
  });
});
