export function formatUSD(value: number | string, compact = false): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "$0.00";
  if (compact) {
    if (n >= 1_000_000_000) return "$" + (n / 1_000_000_000).toFixed(2) + "B";
    if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return "$" + (n / 1_000).toFixed(2) + "K";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: n < 0.01 ? 8 : 2 }).format(n);
}

export function formatNumber(value: number | string, decimals = 2): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "0";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(decimals) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(decimals) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(decimals) + "K";
  return n.toFixed(decimals);
}

export function formatFee(feeTier: number | string): string {
  const n = typeof feeTier === "string" ? parseInt(feeTier) : feeTier;
  return (n / 10000).toFixed(2) + "%";
}

export function formatAddress(address: string): string {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

export function formatDate(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateShort(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateTime(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function daysAgo(days: number): number {
  return Math.floor(Date.now() / 1000) - days * 86400;
}

export function getExplorerUrl(address: string, type: "address" | "tx" = "address"): string {
  return "https://explorer.shardeum.org/" + type + "/" + address;
}
