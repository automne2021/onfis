export function getTimeAgo(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  
  // Tính khoảng cách thời gian bằng giây
  // Math.abs để tránh số âm nếu ngày truyền vào là tương lai 
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // 1. Nếu nhỏ hơn 1 phút -> "Just now"
  if (seconds < 60) {
    return "Just now";
  }
  
  // 2. Nếu nhỏ hơn 1 giờ -> "x minutes ago"
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // 3. Nếu nhỏ hơn 24 giờ -> "x hours ago"
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  // 4. Nếu lớn hơn hoặc bằng 24 giờ -> Trả về Date format (Ví dụ: "Feb 20, 2026")
  // Hàm toLocaleDateString sẽ tự động bỏ phần giờ phút đi
  return date.toLocaleDateString("en-US", {
    month: "short", // "Feb", "Oct"
    day: "numeric", // "20", "31"
    year: "numeric" // "2026"
  });
}