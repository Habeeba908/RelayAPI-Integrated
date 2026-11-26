
import dns from "node:dns/promises";
import net from "node:net";

function isPrivateIPv4(ip) {
  const p = ip.split(".").map(Number);

  if (
    p.length !== 4 ||
    p.some(n => !Number.isInteger(n) || n < 0 || n > 255)
  ) return true;

  return (
    p[0] === 10 ||
    p[0] === 127 ||
    p[0] === 0 ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) ||
    p[0] >= 224
  );
}

function isPrivateIPv6(ip) {
  const s = ip.toLowerCase();

  return (
    s === "::1" ||
    s === "::" ||
    s.startsWith("fc") ||
    s.startsWith("fd") ||
    s.startsWith("fe80:") ||
    s.startsWith("::ffff:127.")
  );
}

export async function validatePublicUrl(raw) {
  let url;

  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing embedded credentials are not allowed.");
  }

  const host = url.hostname
    .replace(/^\[|\]$/g, "")
    .toLowerCase();

  // Explicit localhost development exception.
  const allowLocalhost =
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_LOCALHOST_REQUESTS === "true";

  const isExactLoopback = [
    "localhost",
    "127.0.0.1",
    "::1"
  ].includes(host);

  if (isExactLoopback) {
    if (!allowLocalhost) {
      throw new Error("Localhost access is disabled.");
    }

    // Development localhost may use custom ports.
    return url;
  }

  // Block localhost aliases and local network domains.
  if (
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    throw new Error("Local network destinations are blocked.");
  }

  // Restrict other destinations to standard HTTP/HTTPS ports.
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Only standard HTTP/HTTPS ports are allowed.");
  }

  // Preserve the existing explicit private-network override.
  if (process.env.ALLOW_PRIVATE_NETWORKS === "true") {
    return url;
  }

  if (net.isIP(host)) {
    const blocked = net.isIPv4(host)
      ? isPrivateIPv4(host)
      : isPrivateIPv6(host);

    if (blocked) {
      throw new Error("Private or reserved IP destinations are blocked.");
    }

    return url;
  }

  const records = await dns.lookup(host, {
    all: true,
    verbatim: true
  });

  if (
    !records.length ||
    records.some(record =>
      net.isIPv4(record.address)
        ? isPrivateIPv4(record.address)
        : isPrivateIPv6(record.address)
    )
  ) {
    throw new Error(
      "The hostname resolves to a private or reserved network address."
    );
  }

  return url;
}
