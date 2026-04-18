const VN_TZ = "Asia/Ho_Chi_Minh";

/**
 * Format a LOCAL date string (YYYY-MM-DD) into Vietnamese date display.
 * Avoids UTC parsing that causes off-by-one day errors.
 * Example: "2026-04-04" → "04/04/2026"
 */
export function formatVNDate(localDateStr: string): string {
  if (!localDateStr) return "";
  // Parse as local date to avoid UTC shift
  const [year, month, day] = localDateStr.split("-").map(Number);
  if (!year || !month || !day) return localDateStr;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("vi-VN", { timeZone: VN_TZ });
}

/**
 * Format an ISO 8601 timestamp/Instant into Vietnamese date+time display.
 * Example: "2026-04-04T10:30:00Z" → "04/04/2026, 17:30"
 */
export function formatVNDateTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleString("vi-VN", {
    timeZone: VN_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getTimeAgo(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "Just now";
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: VN_TZ,
  });
}