export function getSubdomainFromHost(
  host: string | null
): string | null {
  if (!host) return null;

  const cleanHost = host.split(":")[0];

  if (cleanHost === "localhost") {
    return null;
  }

  const parts = cleanHost.split(".");

  // clinic1.localhost
  if (
    parts.length >= 2 &&
    parts[1] === "localhost"
  ) {
    return parts[0];
  }

  // clinic1.dentalcrm.uz
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

export function getCurrentSubdomain() {
  if (typeof window === "undefined") {
    return null;
  }

  const host = window.location.hostname;

  if (host === "localhost") {
    return null;
  }

  const parts = host.split(".");

  if (
    host.includes(".localhost") &&
    parts.length >= 2
  ) {
    return parts[0];
  }

  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}