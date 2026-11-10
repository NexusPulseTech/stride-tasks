import { Component, type ErrorInfo, type ReactNode } from 'react';
import { downloadEmergencyBackup } from '../utils/emergencyBackup';

const ERROR_LOG_KEY = 'STRIDE_ERROR_LOG_V1';
const MAX_ERROR_LOG = 20;

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Ghi lỗi cục bộ để hỗ trợ điều tra khi người dùng gửi báo cáo; không gửi đi đâu */
function recordError(error: Error, info: ErrorInfo): void {
  try {
    const raw = localStorage.getItem(ERROR_LOG_KEY);
    const log = raw ? (JSON.parse(raw) as unknown[]) : [];
    const entry = {
      at: new Date().toISOString(),
      message: String(error?.message || error).slice(0, 500),
      stack: String(info?.componentStack || '').slice(0, 2000),
    };
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify([...(Array.isArray(log) ? log : []), entry].slice(-MAX_ERROR_LOG)));
  } catch {
    // Bộ nhớ đầy hoặc bị chặn: bỏ qua, màn hình khôi phục vẫn phải hiện
  }
}

/**
 * Lỗi render không được làm trắng màn hình. Chữ song ngữ cố định vì màn hình này nằm ngoài LanguageProvider,
 * và nút sao lưu đọc thẳng localStorage nên vẫn chạy khi state của app hỏng.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    recordError(error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px 16px',
          fontFamily: 'system-ui, sans-serif',
          lineHeight: 1.6,
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Có lỗi xảy ra · Something went wrong</h1>
          <p style={{ margin: '0 0 4px' }}>Dữ liệu của bạn vẫn nằm an toàn trên máy. Hãy tải lại trang, hoặc lưu một bản sao lưu trước.</p>
          <p style={{ margin: '0 0 16px' }}>Your data is still safe on this device. Reload the page, or save a backup first.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => window.location.reload()} style={{ padding: '8px 14px', cursor: 'pointer' }}>
              Tải lại · Reload
            </button>
            <button type="button" onClick={downloadEmergencyBackup} style={{ padding: '8px 14px', cursor: 'pointer' }}>
              Lưu bản sao lưu · Save backup (.json)
            </button>
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 13, opacity: 0.75 }}>
            support@nexuspulsetech.xyz
          </p>
        </div>
      </main>
    );
  }
}
