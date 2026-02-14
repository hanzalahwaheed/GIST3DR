export function getOptionalAuthToken(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const token = window.localStorage.getItem("token");
  return token ?? undefined;
}
