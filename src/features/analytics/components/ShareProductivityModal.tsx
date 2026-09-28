import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Copy, Check } from 'lucide-react';
import { CompletedTaskItem } from '../utils/completedTasksHelper';

interface ShareProductivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedTasks: CompletedTaskItem[];
  streak: number;
  totalCompleted: number;
  maxDayCount: number;
  showToast: (msg: string) => void;
}

type FlexRange = 'week' | 'month' | 'streak';

export function ShareProductivityModal({
  isOpen,
  onClose,
  completedTasks,
  streak,
  totalCompleted,
  maxDayCount,
  showToast,
}: ShareProductivityModalProps) {
  const [range, setRange] = useState<FlexRange>('week');
  const [isCopiedText, setIsCopiedText] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Lọc công việc theo khoảng thời gian
  const filteredTasks = React.useMemo(() => {
    const today = new Date();
    if (range === 'week') {
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      return completedTasks.filter((t) => new Date(t.completedAt).getTime() >= startOfWeek.getTime());
    }
    if (range === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return completedTasks.filter((t) => new Date(t.completedAt).getTime() >= startOfMonth.getTime());
    }
    return completedTasks;
  }, [completedTasks, range]);

  const tasksDoneCount = filteredTasks.length;
  const topTasks = filteredTasks.slice(0, 4);

  const getRangeLabel = () => {
    const now = new Date();
    if (range === 'week') return `Tuần này (${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()})`;
    if (range === 'month') return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
    return `Chuỗi kỉ lục (${streak} ngày liên tục)`;
  };

  // Vẽ thẻ Flex theo chuẩn tối giản (Apple / Linear style: Monochrome & High Contrast)
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 480;
    const scale = 2; // 2x for sharp retina rendering

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Nền đen than chì sâu #090d14
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, width, height);

    // Đường viền tóc thanh mảnh
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Tiêu đề nhỏ
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('BÁO CÁO NĂNG SUẤT', 36, 52);

    // Tiêu đề chính
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(getRangeLabel(), 36, 84);

    // 3 Cột số liệu chính
    const boxY = 110;
    const boxW = 224;
    const boxH = 76;
    const boxGap = 16;

    const stats = [
      { label: 'Việc hoàn thành', val: `${tasksDoneCount}` },
      { label: 'Chuỗi liên tiếp', val: `${streak} ngày` },
      { label: 'Kỷ lục ngày', val: `${maxDayCount} việc` },
    ];

    stats.forEach((st, i) => {
      const bx = 36 + i * (boxW + boxGap);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(bx, boxY, boxW, boxH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.strokeRect(bx, boxY, boxW, boxH);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(st.label, bx + 14, boxY + 26);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(st.val, bx + 14, boxY + 56);
    });

    // Danh sách việc tiêu biểu đã xong
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('MỤC TIÊU ĐÃ HOÀN THÀNH', 36, 226);

    const taskStartY = 246;
    if (topTasks.length === 0) {
      ctx.fillStyle = '#475569';
      ctx.font = 'italic 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Chưa có công việc nào trong khoảng thời gian này.', 36, taskStartY + 14);
    } else {
      topTasks.forEach((item, idx) => {
        const ty = taskStartY + idx * 36;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('—', 36, ty + 12);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const truncatedTitle = item.title.length > 55 ? item.title.slice(0, 52) + '...' : item.title;
        ctx.fillText(truncatedTitle, 54, ty + 12);

        ctx.fillStyle = '#475569';
        ctx.font = '400 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(item.projectName, 580, ty + 12);
      });
    }

    // Đường kẻ phân cách footer
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(36, 420);
    ctx.lineTo(width - 36, 420);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Solo Tasks · Tập trung hoàn thành công việc', 36, 444);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('LOCAL-FIRST', width - 110, 444);
  }, [range, tasksDoneCount, streak, maxDayCount, topTasks]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => drawCanvas(), 50);
    }
  }, [isOpen, drawCanvas]);

  if (!isOpen) return null;

  // Xử lý tải ảnh về máy
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `bao-cao-nang-suat-${range}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Đã tải ảnh thẻ về máy');
  };

  // Sao chép ảnh vào clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          handleDownloadImage();
          return;
        }
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setIsCopiedImage(true);
            setTimeout(() => setIsCopiedImage(false), 2000);
            showToast('Đã sao chép ảnh thẻ');
            return;
          } catch (err) {
            handleDownloadImage();
          }
        } else {
          handleDownloadImage();
        }
      }, 'image/png');
    } catch (e) {
      handleDownloadImage();
    }
  };

  // Sao chép bài viết văn bản
  const handleCopyText = () => {
    const rangeText = range === 'week' ? 'Tuần này' : range === 'month' ? 'Tháng này' : 'Thời gian qua';
    const lines = [
      `${rangeText} đã hoàn thành ${tasksDoneCount} công việc.`,
      `Chuỗi liên tục: ${streak} ngày. Kỷ lục ngày: ${maxDayCount} việc.`,
      '',
      'Mục tiêu đã hoàn thành:',
      ...topTasks.map((t) => `• ${t.title} (${t.projectName})`),
      '',
      '#Productivity #WorkDone #Focus',
    ];
    const fullText = lines.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      setIsCopiedText(true);
      setTimeout(() => setIsCopiedText(false), 2000);
      showToast('Đã sao chép văn bản tóm tắt');
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#12161f] rounded-xl max-w-[540px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header tối giản */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100">
              Chia sẻ kết quả công việc
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Tải ảnh thẻ tối giản hoặc sao chép văn bản tóm tắt
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Nội dung */}
        <div className="p-4 space-y-3.5 overflow-y-auto text-xs text-slate-600 dark:text-slate-300">
          {/* Segmented controls chọn khoảng thời gian */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Khoảng thời gian:
            </span>
            <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/60 rounded-md text-[11.5px]">
              <button
                type="button"
                onClick={() => setRange('week')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  range === 'week'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tuần này
              </button>
              <button
                type="button"
                onClick={() => setRange('month')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  range === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => setRange('streak')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  range === 'streak'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Toàn chuỗi
              </button>
            </div>
          </div>

          {/* Xem trước thẻ Canvas */}
          <div className="relative rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-2xs bg-[#090d14]">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block select-none"
              style={{ aspectRatio: '800 / 480' }}
            />
          </div>

          {/* Đoạn trích văn bản tóm tắt */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-800 text-[11.5px] font-mono text-slate-600 dark:text-slate-400 select-all leading-relaxed">
            {range === 'week' ? 'Tuần này' : range === 'month' ? 'Tháng này' : 'Thời gian qua'} đã hoàn thành {tasksDoneCount} công việc. Chuỗi liên tục: {streak} ngày.
          </div>
        </div>

        {/* Footer thao tác */}
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="h-7.5 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isCopiedText ? <Check className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Sao chép chữ</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              className="h-7.5 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isCopiedImage ? <Check className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Sao chép ảnh</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              className="h-7.5 px-3 rounded-md bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải ảnh PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
