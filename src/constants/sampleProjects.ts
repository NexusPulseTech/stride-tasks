import { Project } from '../types';
import type { Language } from '../i18n/types';

/**
 * Dữ liệu ví dụ cho lần mở đầu tiên, theo ngôn ngữ người dùng (A12). Mỗi việc minh họa một tính năng: việc lặp lại có
 * quỹ thời gian và ghim, việc con ba cấp, việc đã xong, link trong tiêu đề, dự án thu gọn.
 *
 * Quy tắc bắt buộc:
 * - Giữ ID dự án p1, p2: dự án ví dụ không bị tính vào giới hạn 5 dự án của bản Miễn phí (useProLicense).
 * - Không dùng giá trị phụ thuộc thời gian: dữ liệu chỉ được coi là ví dụ khi giống hệt một bộ ở đây (isSampleTemplate).
 * - LEGACY_SAMPLE_PROJECTS là bộ tiếng Việt trước A12, giữ NGUYÊN VĂN để người dùng cũ vẫn được nhận diện là đang xem ví dụ.
 */

const EN: Project[] = [
  {
    id: 'p1',
    name: 'Getting started',
    color: '#0071e3',
    isExpanded: true,
    tasks: [
      {
        id: 't_daily_habit',
        title: 'Plan your day in 10 minutes',
        status: 'todo',
        isPinned: true,
        recurrence: 'daily',
        recurrenceStreak: 3,
        estimatedMinutes: 10,
        focusedMinutes: 5,
        pomodoroSessions: 0,
        subtasks: [
          { id: 's_dh_1', title: 'Pick your top 3 tasks for today', completed: false, status: 'todo' },
          { id: 's_dh_2', title: 'Block time for focused work', completed: false, status: 'todo' },
        ],
      },
      {
        id: 't_hierarchical_demo',
        title: 'Launch a personal website',
        status: 'doing',
        isPinned: true,
        estimatedMinutes: 90,
        focusedMinutes: 50,
        pomodoroSessions: 2,
        subtasks: [
          {
            id: 's_phase_1',
            title: 'Plan',
            completed: true,
            subtasks: [
              { id: 's_1_1', title: 'Write a one-page brief', completed: true },
              { id: 's_1_2', title: 'Collect five websites you like', completed: true },
              { id: 's_1_3', title: 'Choose a domain name', completed: true },
            ],
          },
          {
            id: 's_phase_2',
            title: 'Build',
            completed: false,
            subtasks: [
              { id: 's_2_1', title: 'Design the home page', completed: true },
              { id: 's_2_2', title: 'Write the About page', completed: false },
              { id: 's_2_3', title: 'Add a contact form', completed: false },
            ],
          },
          {
            id: 's_phase_3',
            title: 'Publish',
            completed: false,
            subtasks: [
              { id: 's_3_1', title: 'Test on your phone', completed: false },
              { id: 's_3_2', title: 'Connect the domain', completed: false },
              { id: 's_3_3', title: 'Share the link with three friends', completed: false },
            ],
          },
        ],
      },
      {
        id: 't2',
        title: 'Set up a weekly review',
        status: 'done',
        subtasks: [
          { id: 's4', title: 'Pick a fixed time each week', completed: true },
          { id: 's5', title: 'Write three review questions', completed: true },
        ],
      },
      {
        id: 't3',
        title: 'See how Stride Tasks works https://tasks.nexuspulsetech.xyz/en/',
        status: 'todo',
        subtasks: [],
      },
    ],
  },
  {
    id: 'p2',
    name: 'Learning',
    color: '#34c759',
    isExpanded: false,
    tasks: [
      { id: 'tk1', title: 'Choose one course to finish this month', status: 'done', subtasks: [] },
      { id: 'tk2', title: 'Study chapter 3', status: 'doing', estimatedMinutes: 45, subtasks: [] },
      { id: 'tk3', title: 'Review your notes from last week', status: 'todo', subtasks: [] },
    ],
  },
];

const VI: Project[] = [
  {
    id: 'p1',
    name: 'Bắt đầu nhanh',
    color: '#0071e3',
    isExpanded: true,
    tasks: [
      {
        id: 't_daily_habit',
        title: 'Lên kế hoạch cho ngày mới trong 10 phút',
        status: 'todo',
        isPinned: true,
        recurrence: 'daily',
        recurrenceStreak: 3,
        estimatedMinutes: 10,
        focusedMinutes: 5,
        pomodoroSessions: 0,
        subtasks: [
          { id: 's_dh_1', title: 'Chọn 3 việc quan trọng nhất hôm nay', completed: false, status: 'todo' },
          { id: 's_dh_2', title: 'Dành một khung giờ để làm việc tập trung', completed: false, status: 'todo' },
        ],
      },
      {
        id: 't_hierarchical_demo',
        title: 'Ra mắt website cá nhân',
        status: 'doing',
        isPinned: true,
        estimatedMinutes: 90,
        focusedMinutes: 50,
        pomodoroSessions: 2,
        subtasks: [
          {
            id: 's_phase_1',
            title: 'Lên kế hoạch',
            completed: true,
            subtasks: [
              { id: 's_1_1', title: 'Viết bản mô tả một trang', completed: true },
              { id: 's_1_2', title: 'Tìm năm website bạn thích', completed: true },
              { id: 's_1_3', title: 'Chọn tên miền', completed: true },
            ],
          },
          {
            id: 's_phase_2',
            title: 'Xây dựng',
            completed: false,
            subtasks: [
              { id: 's_2_1', title: 'Thiết kế trang chủ', completed: true },
              { id: 's_2_2', title: 'Viết trang giới thiệu', completed: false },
              { id: 's_2_3', title: 'Thêm biểu mẫu liên hệ', completed: false },
            ],
          },
          {
            id: 's_phase_3',
            title: 'Ra mắt',
            completed: false,
            subtasks: [
              { id: 's_3_1', title: 'Kiểm tra trên điện thoại', completed: false },
              { id: 's_3_2', title: 'Kết nối tên miền', completed: false },
              { id: 's_3_3', title: 'Gửi link cho ba người bạn', completed: false },
            ],
          },
        ],
      },
      {
        id: 't2',
        title: 'Thiết lập buổi tổng kết hằng tuần',
        status: 'done',
        subtasks: [
          { id: 's4', title: 'Chọn một khung giờ cố định mỗi tuần', completed: true },
          { id: 's5', title: 'Viết ba câu hỏi tổng kết', completed: true },
        ],
      },
      {
        id: 't3',
        title: 'Xem Stride Tasks hoạt động thế nào https://tasks.nexuspulsetech.xyz/vi/',
        status: 'todo',
        subtasks: [],
      },
    ],
  },
  {
    id: 'p2',
    name: 'Học tập',
    color: '#34c759',
    isExpanded: false,
    tasks: [
      { id: 'tk1', title: 'Chọn một khóa học để hoàn thành trong tháng', status: 'done', subtasks: [] },
      { id: 'tk2', title: 'Học chương 3', status: 'doing', estimatedMinutes: 45, subtasks: [] },
      { id: 'tk3', title: 'Ôn lại ghi chú của tuần trước', status: 'todo', subtasks: [] },
    ],
  },
];

/** Bộ ví dụ tiếng Việt trước A12 (giữ nguyên văn, chỉ dùng để nhận diện, không tạo mới) */
export const LEGACY_SAMPLE_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Làm Game Kiếm Tiền YouTube',
    color: '#0071e3',
    isExpanded: true,
    tasks: [
      {
        id: 't_daily_habit',
        title: 'Post Video X / Shorts hàng ngày (Việc lặp lại định kỳ)',
        status: 'todo',
        isPinned: true,
        recurrence: 'daily',
        recurrenceStreak: 3,
        estimatedMinutes: 30,
        focusedMinutes: 25,
        pomodoroSessions: 1,
        subtasks: [
          { id: 's_dh_1', title: 'Cắt video clip 45s khoảnh khắc game hay', completed: false, status: 'todo' },
          { id: 's_dh_2', title: 'Đăng lên X & YouTube Shorts kèm hashtag', completed: false, status: 'todo' },
        ],
      },
      {
        id: 't_hierarchical_demo',
        title: 'Phát triển Game Indie hoàn chỉnh (Mô hình 3 cấp việc lồng nhau)',
        status: 'doing',
        isPinned: true,
        estimatedMinutes: 90,
        focusedMinutes: 50,
        pomodoroSessions: 2,
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

const SAMPLE_PROJECTS: Record<Language, Project[]> = { en: EN, vi: VI };

/** Bản sao mới của bộ ví dụ theo ngôn ngữ (an toàn để chỉnh sửa) */
export function getSampleProjects(language: Language): Project[] {
  return JSON.parse(JSON.stringify(SAMPLE_PROJECTS[language] ?? EN));
}

const SAMPLE_SIGNATURES: ReadonlySet<string> = new Set([EN, VI, LEGACY_SAMPLE_PROJECTS].map((p) => JSON.stringify(p)));

/** Đúng nguyên văn một bộ ví dụ (mọi chỉnh sửa đều là dữ liệu thật của người dùng) */
export function matchesSampleTemplate(projects: Project[]): boolean {
  try {
    return SAMPLE_SIGNATURES.has(JSON.stringify(projects));
  } catch {
    return false;
  }
}

/** ID dự án ví dụ (giống nhau ở mọi bộ): không tính vào giới hạn dự án của bản Miễn phí */
export const SAMPLE_PROJECT_IDS: ReadonlySet<string> = new Set([EN, VI, LEGACY_SAMPLE_PROJECTS].flatMap((p) => p.map((x) => x.id)));

export interface SampleActivity {
  daysAgo: number;
  time: string;
  title: string;
  projectId: 'p1' | 'p2';
  subsDone: number;
  subsTotal: number;
}

const ACTIVITY_SLOTS: Array<Omit<SampleActivity, 'title'>> = [
  { daysAgo: 0, time: '14:30', projectId: 'p1', subsDone: 2, subsTotal: 2 },
  { daysAgo: 0, time: '10:15', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 1, time: '16:45', projectId: 'p2', subsDone: 0, subsTotal: 0 },
  { daysAgo: 1, time: '09:20', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 2, time: '15:10', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 3, time: '17:30', projectId: 'p2', subsDone: 0, subsTotal: 0 },
  { daysAgo: 3, time: '11:00', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 4, time: '14:00', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 5, time: '16:20', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 5, time: '10:40', projectId: 'p2', subsDone: 0, subsTotal: 0 },
  { daysAgo: 6, time: '15:50', projectId: 'p2', subsDone: 0, subsTotal: 0 },
  { daysAgo: 6, time: '09:30', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 8, time: '14:15', projectId: 'p2', subsDone: 0, subsTotal: 0 },
  { daysAgo: 9, time: '16:00', projectId: 'p2', subsDone: 0, subsTotal: 0 },
  { daysAgo: 9, time: '11:20', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 11, time: '15:00', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 12, time: '10:30', projectId: 'p2', subsDone: 0, subsTotal: 0 },
  { daysAgo: 13, time: '14:40', projectId: 'p1', subsDone: 0, subsTotal: 0 },
  { daysAgo: 13, time: '09:15', projectId: 'p2', subsDone: 0, subsTotal: 0 },
];

const ACTIVITY_TITLES: Record<Language, string[]> = {
  en: [
    'Set up a weekly review',
    'Choose a domain name',
    'Choose one course to finish this month',
    'Collect five websites you like',
    'Write a one-page brief',
    'Watch the course introduction',
    'Design the home page',
    'Sketch the site map on paper',
    'List the pages the site needs',
    'Study chapter 1',
    'Make flashcards for chapter 1',
    'Compare three website builders',
    'Review chapter 1 notes',
    'Study chapter 2',
    'Plan two hours a day for the project',
    'Write down why the website matters',
    'Set a daily study reminder',
    'Gather photos and logos',
    'Pick a note-taking method',
  ],
  vi: [
    'Thiết lập buổi tổng kết hằng tuần',
    'Chọn tên miền',
    'Chọn một khóa học để hoàn thành trong tháng',
    'Tìm năm website bạn thích',
    'Viết bản mô tả một trang',
    'Xem phần giới thiệu khóa học',
    'Thiết kế trang chủ',
    'Phác thảo sơ đồ trang trên giấy',
    'Liệt kê các trang website cần có',
    'Học chương 1',
    'Làm thẻ ghi nhớ cho chương 1',
    'So sánh ba công cụ làm website',
    'Ôn lại ghi chú chương 1',
    'Học chương 2',
    'Dành hai giờ mỗi ngày cho dự án',
    'Viết ra lý do website quan trọng với bạn',
    'Đặt nhắc nhở học mỗi ngày',
    'Gom ảnh và logo',
    'Chọn cách ghi chép',
  ],
};

/** Lịch sử hoàn thành ví dụ cho heatmap và bảng việc đã xong (14 ngày gần nhất), cùng ngôn ngữ với bộ ví dụ */
export function getSampleActivity(language: Language): Array<SampleActivity & { projectName: string }> {
  const projects = SAMPLE_PROJECTS[language] ?? EN;
  const titles = ACTIVITY_TITLES[language] ?? ACTIVITY_TITLES.en;
  return ACTIVITY_SLOTS.map((slot, i) => ({
    ...slot,
    title: titles[i],
    projectName: projects.find((p) => p.id === slot.projectId)?.name ?? '',
  }));
}
