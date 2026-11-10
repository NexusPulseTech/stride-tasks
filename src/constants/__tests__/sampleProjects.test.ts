import { describe, expect, it } from 'vitest';
import { Project } from '../../types';
import {
  getSampleActivity,
  getSampleProjects,
  LEGACY_SAMPLE_PROJECTS,
  matchesSampleTemplate,
  SAMPLE_PROJECT_IDS,
} from '../sampleProjects';

const VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
const allText = (projects: Project[]) => JSON.stringify(projects);

describe('bộ dự án ví dụ theo ngôn ngữ (A12)', () => {
  it('người dùng tiếng Anh nhận ví dụ tiếng Anh, người dùng tiếng Việt nhận ví dụ tiếng Việt', () => {
    expect(allText(getSampleProjects('en'))).not.toMatch(VIETNAMESE);
    expect(getSampleProjects('en')[0].name).toBe('Getting started');
    expect(getSampleProjects('vi')[0].name).toBe('Bắt đầu nhanh');
  });

  it('không có emoji và không còn nội dung YouTube/TikTok của bộ cũ', () => {
    for (const lang of ['en', 'vi'] as const) {
      const text = allText(getSampleProjects(lang));
      expect(text).not.toMatch(EMOJI);
      expect(text).not.toMatch(/youtube|tiktok/i);
    }
  });

  it('giữ ID dự án p1, p2 ở mọi bộ để dự án ví dụ không bị tính vào giới hạn Free', () => {
    for (const projects of [getSampleProjects('en'), getSampleProjects('vi'), LEGACY_SAMPLE_PROJECTS]) {
      expect(projects.map((p) => p.id)).toEqual(['p1', 'p2']);
    }
    expect([...SAMPLE_PROJECT_IDS].sort()).toEqual(['p1', 'p2']);
  });

  it('nhận diện đúng cả ba bộ (kể cả bộ cũ của người dùng hiện có); chỉnh một chữ là dữ liệu thật', () => {
    expect(matchesSampleTemplate(getSampleProjects('en'))).toBe(true);
    expect(matchesSampleTemplate(getSampleProjects('vi'))).toBe(true);
    expect(matchesSampleTemplate(JSON.parse(JSON.stringify(LEGACY_SAMPLE_PROJECTS)))).toBe(true);
    const edited = getSampleProjects('en');
    edited[0].tasks[0].title += '!';
    expect(matchesSampleTemplate(edited)).toBe(false);
  });

  it('trả về bản sao: sửa bản đã lấy không làm hỏng bộ gốc', () => {
    const copy = getSampleProjects('en');
    copy[0].name = 'Changed';
    expect(getSampleProjects('en')[0].name).toBe('Getting started');
  });

  it('lịch sử hoàn thành ví dụ cùng ngôn ngữ và cùng tên dự án với bộ ví dụ', () => {
    const en = getSampleActivity('en');
    expect(en).toHaveLength(19);
    expect(JSON.stringify(en)).not.toMatch(VIETNAMESE);
    expect(new Set(en.map((a) => a.projectName))).toEqual(new Set(['Getting started', 'Learning']));
    expect(new Set(getSampleActivity('vi').map((a) => a.projectName))).toEqual(new Set(['Bắt đầu nhanh', 'Học tập']));
  });
});
