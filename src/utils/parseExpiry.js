function parseExpiryDays(input) {
  const n = parseInt(input, 10);
  if (isNaN(n)) throw new Error("Days must be a whole number.");
  if (n < 0) throw new Error("Days cannot be negative. Use 0 for a lifetime (never-expiring) license.");
  if (n === 0) return null;
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
