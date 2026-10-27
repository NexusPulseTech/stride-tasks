/** Rút gọn chuỗi hiển thị trong thông báo; chỉ thêm dấu "…" khi thực sự bị cắt */
export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}
