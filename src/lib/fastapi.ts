const DEFAULT_FASTAPI_URL = "http://localhost:8000";

export const getFastApiUrl = (): string => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_FASTAPI_BASE_URL || DEFAULT_FASTAPI_URL;
  }
  return (process.env.NEXT_PUBLIC_FASTAPI_BASE_URL || DEFAULT_FASTAPI_URL).replace(/\/$/, "");
};
