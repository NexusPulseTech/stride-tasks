import { Project } from '../types';

export const STORAGE_KEY = 'SOLO_CORE_TASKS_V4';
export const STREAK_KEY = 'SOLO_CORE_STREAK_V4';
export const MUTED_KEY = 'SOLO_MUTED_V1';
export const REMINDER_KEY = 'SOLO_REMINDER_V1';
export const ACTIVITY_KEY = 'SOLO_CHECKLIST_ACTIVITY_LOG_V1';
export const COMPLETED_LOGS_KEY = 'SOLO_COMPLETED_LOGS_V2';
export const APP_VERSION = '1.0.4';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Làm Game Kiếm Tiền YouTube',
    color: '#0071e3',
    isExpanded: true,
    tasks: [
      {
        id: 't_hierarchical_demo',
        title: 'Phát triển Game Indie hoàn chỉnh (Mô hình 3 cấp việc lồng nhau)',
        status: 'doing',
        isPinned: true,
        subtasks: [
          {
            id: 's_phase_1',
            title: 'Giai đoạn 1: Nghiên cứu thị trường & Ý tưởng (3 bước nhỏ)',
            completed: true,
            subtasks: [
              { id: 's_1_1', title: 'Xem 10 video phân tích gameplay thành công https://youtube.com', completed: true },
              { id: 's_1_2', title: 'Khảo sát chỉ số người chơi trên SteamDB https://steamdb.info', completed: true },
              { id: 's_1_3', title: 'Chốt tài liệu thiết kế game 1 trang (GDD)', completed: true },
            ],
          },
          {
            id: 's_phase_2',
            title: 'Giai đoạn 2: Lập trình cơ chế Gameplay cốt lõi (3 bước nhỏ)',
            completed: false,
            subtasks: [
              { id: 's_2_1', title: 'Hệ thống di chuyển nhân vật & va chạm mượt mà', completed: true },
              { id: 's_2_2', title: 'Thiết kế AI kẻ địch & thuật toán bám đuổi', completed: false },
              { id: 's_2_3', title: 'Hệ thống vũ khí & tính điểm combo', completed: false },
            ],
          },
          {
            id: 's_phase_3',
            title: 'Giai đoạn 3: Phát hành & Quảng bá YouTube Devlog (3 bước nhỏ)',
            completed: false,
            subtasks: [
              { id: 's_3_1', title: 'Dựng video devlog #1 giới thiệu dự án', completed: false },
              { id: 's_3_2', title: 'Thiết kế thumbnail bắt mắt & tối ưu SEO tiêu đề', completed: false },
              { id: 's_3_3', title: 'Đăng tải video & ghim link chơi thử bản demo', completed: false },
            ],
          },
        ],
      },
      {
        id: 't2',
        title: 'Mua tên miền & cấu hình hosting https://cloudflare.com',
        status: 'done',
        subtasks: [
          { id: 's4', title: 'Chọn tên miền ngắn gọn dễ nhớ', completed: true },
          { id: 's5', title: 'Trỏ DNS về máy chủ', completed: true },
        ],
      },
      {
        id: 't3',
        title: 'Tổng hợp tài liệu dự án vào Notion https://notion.so',
        status: 'todo',
        subtasks: [],
      },
    ],
  },
  {
    id: 'p2',
    name: 'Kênh TikTok triệu view',
    color: '#34c759',
    isExpanded: false,
    tasks: [
      { id: 'tk1', title: 'Lên 10 kịch bản video ngắn dạng checklist', status: 'done', subtasks: [] },
      { id: 'tk2', title: 'Quay và dựng 5 video mẫu bằng CapCut', status: 'doing', subtasks: [] },
      { id: 'tk3', title: 'Đăng đều 1 video mỗi ngày vào khung giờ vàng 19h', status: 'todo', subtasks: [] },
    ],
  },
];
