import type { RefreshTokenRequest, RefreshTokenResponse } from "./types";

export async function mockRefreshToken(
  request?: RefreshTokenRequest
): Promise<RefreshTokenResponse> {
  const token = request?.refresh_token || "mock_refresh_token_" + Date.now();
  return {
    access_token: `mock_refreshed_access_token_${Date.now()}`,
    token_type: "bearer",
    refresh_token: token,
    expires_in: 2592000,
  };
}
