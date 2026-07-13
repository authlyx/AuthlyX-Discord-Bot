function parseExpiryDays(input) {
  if (!input) return null;
  const n = parseInt(input, 10);
  if (isNaN(n) || n <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function formatExpiry(dateStr) {
  if (!dateStr) return "Never";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

module.exports = { parseExpiryDays, formatExpiry };
