
import { backendClient } from "./apiClient";

export interface ShareSnapshot {
  type: "request" | "collection";
  [key: string]: unknown;
}

export interface ShareResponse {
  success: boolean;
  token: string;
  shareUrl: string;
  apiUrl: string;
  curlCommand: string;
  expiresAt: string;
}

export interface SharedDataResponse {
  success: boolean;
  snapshot: ShareSnapshot;
  expiresAt: string | null;
}

export async function createShareLink(
  snapshot: Record<string, unknown>,
  type: "request" | "collection" = "request"
): Promise<ShareResponse> {
  const response = await backendClient.post<ShareResponse>(
    "/share",
    { type, snapshot }
  );

  return response.data;
}

export async function getSharedSnapshot(
  token: string
): Promise<SharedDataResponse> {
  const response = await backendClient.get<SharedDataResponse>(
    `/share/${encodeURIComponent(token)}`
  );

  return response.data;
}
