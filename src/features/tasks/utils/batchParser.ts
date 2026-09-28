// Tách dòng văn bản được paste thành nhiều task sạch sẽ
export const parsePastedTasks = (rawText: string): string[] => {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s*\-•\d.)\][]+/, '').trim())
    .filter((line) => line.length > 0);
};
