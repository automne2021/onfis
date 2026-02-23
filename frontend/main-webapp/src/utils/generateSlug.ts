export function generateSlug(title: string): string {
  if (!title) return ""

  // Chuyển toàn bộ thành chữ thường
  let slug = title.toLowerCase();

  // Xóa dấu tiếng Việt (chuẩn hóa Unicode)
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Xử lý chữ đ/Đ riêng vì normalize không xử lý được chữ này
  slug = slug.replace(/[đĐ]/g, 'd');

  // Thay thế các khoảng trắng và ký tự đặc biệt bằng dấu gạch ngang (-)
  slug = slug.replace(/[^a-z0-9]+/g, '-');

  // Xóa các dấu gạch ngang bị trùng lặp (ví dụ: "a---b" thành "a-b")
  slug = slug.replace(/-+/g, '-');

  // Xóa dấu gạch ngang ở đầu và cuối chuỗi (nếu có)
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}