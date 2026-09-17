export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const clean = String(dateStr).trim();
  if (!clean) return "-";

  // If pure YYYY-MM-DD date string, format directly to DD/MM/YYYY to avoid any timezone shift
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  try {
    const d = new Date(clean);
    if (isNaN(d.getTime())) return clean;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return clean;
  }
}

export function formatDateTime(dateTimeStr?: string | null): string {
  if (!dateTimeStr) return "-";
  const clean = String(dateTimeStr).trim();
  if (!clean) return "-";
  try {
    const d = new Date(clean);
    if (isNaN(d.getTime())) return clean;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return clean;
  }
}

export function formatGpa(score?: number | null): string {
  if (score === null || score === undefined || isNaN(score)) return "-";
  return score.toFixed(2);
}

export function formatCurrency(amount?: number | null): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

