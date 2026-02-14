import { type ApiErrorResponse } from "@/types/patient";

const DEFAULT_FASTAPI_BASE_URL = "http://localhost:8000";

export class FastApiProxyError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "FastApiProxyError";
    this.status = status;
    this.detail = detail;
  }
}

export function getFastApiBaseUrl(): string {
  const configured = process.env.FASTAPI_BASE_URL?.trim();
  return (configured && configured.length > 0 ? configured : DEFAULT_FASTAPI_BASE_URL).replace(/\/+$/, "");
}

export function forwardAuthHeader(headers: Headers): HeadersInit {
  const auth = headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}

async function tryReadResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const textBody = await response.text();
    return textBody.length > 0 ? textBody : null;
  } catch {
    return null;
  }
}

export async function fastApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const endpoint = `${getFastApiBaseUrl()}${normalizedPath}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...init,
      cache: "no-store",
    });
  } catch (error) {
    throw new FastApiProxyError(
      "Failed to reach FastAPI backend",
      502,
      error instanceof Error ? error.message : String(error),
    );
  }

  if (!response.ok) {
    const detail = await tryReadResponseBody(response);
    const message =
      typeof detail === "object" && detail !== null && "detail" in detail
        ? String((detail as { detail: unknown }).detail)
        : `FastAPI request failed (${response.status})`;

    throw new FastApiProxyError(message, response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await tryReadResponseBody(response);
  return body as T;
}

export function toApiErrorResponse(error: unknown): ApiErrorResponse {
  if (error instanceof FastApiProxyError) {
    return {
      error: error.message,
      detail: error.detail,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500,
    };
  }

  return {
    error: "Unexpected error",
    detail: error,
    status: 500,
  };
}
