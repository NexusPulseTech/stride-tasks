# Đánh giá mức độ sẵn sàng của sản phẩm (Readiness Audit)

> **Thuộc**: 03-product · **Trạng thái**: Reviewed · **Cập nhật**: 2026-10-30 · **Phiên bản đánh giá**: v3.1.0 (commit `f02b195`)
> **Phương pháp**: đọc mã nguồn, cấu hình build/CI, chạy kiểm thử (sync merge 17/17, Worker 17/17, smoke test production 14/14), soát `index.html`/SEO và quy trình phát hành.

## 1. Kết luận

> **Giá trị sản phẩm: ĐỦ để bán (MVP+). Khả năng thu tiền: CHƯA.**
> Lõi tính năng phong phú hơn nhiều đối thủ cùng giá, nhưng đường từ "người lạ" tới "khách trả tiền" còn đứt ở 4 chỗ: **thanh toán chưa bật**, **thiếu trang pháp lý**, **SEO sai thương hiệu**, **không đo lường**. Nền móng kỹ thuật (test, kiểu dữ liệu, CI) **yếu** — chưa chặn việc bán, nhưng là rủi ro lớn nhất khi có khách thật.

## 2. Bảng điểm (0 = chưa có · 5 = chuẩn công nghiệp)

| # | Hạng mục | Điểm | Bằng chứng | Khoảng trống chính |
| :---: | :--- | :---: | :--- | :--- |
| 1 | Giá trị cốt lõi (task, NLP, việc con, Kanban, Pomodoro, SM-2, heatmap) | **4** | ~26k dòng TS/TSX trong `src/`, đủ luồng plan → focus → review | Nhắc việc khi app đóng hạn chế; chưa có app di động native |
| 2 | An toàn dữ liệu người dùng | **4** | localStorage + bản sao IndexedDB, `navigator.storage.persist`, xử lý `QuotaExceeded`, banner khôi phục khẩn cấp, xuất/nhập JSON | Không có **Error Boundary** → lỗi render làm trắng màn hình |
| 3 | Đồng bộ E2E | **4** | AES-256-GCM + HKDF, CAS theo version, LWW + tombstone (TTL 90 ngày); test 17/17 + smoke test production 14/14 | Chưa bật trên production; chưa thu hồi khi hoàn tiền |
| 4 | Bản quyền (licensing) | **3** | Token Ed25519 offline, xác minh lúc khởi động, chống sửa | `/claim` chỉ bảo vệ bằng mã đơn 30-bit; không có danh sách thu hồi; khôi phục bản quyền phụ thuộc email/LemonSqueezy |
| 5 | **Sẵn sàng thu tiền** | **1** | Code VietQR/LemonSqueezy có sẵn | Paywall tắt, Worker chưa có secret, LemonSqueezy rủi ro không chi trả về VN, chưa có Điều khoản/Hoàn tiền |
| 6 | **SEO & marketing** | **1** | Có canonical, OG image, Search Console | Thương hiệu "TaskTodo", chỉ tiếng Việt, không trang đích tĩnh, sitemap 1 URL |
| 7 | **Kỹ thuật chất lượng** | **1** | `npm run lint` = `tsc --noEmit`; build trong CI | **Không** test trong repo, **không** ESLint/Prettier, `tsconfig` **không `strict`**, 29 file > 300 dòng (vi phạm chuẩn của chính dự án) |
| 8 | Bảo mật | **3** | E2E, khóa bí mật không lọt bundle (đã quét), webhook fail-closed | Tauri `csp: null`; GitHub Pages không đặt được header bảo mật; Worker chưa rate limit |
| 9 | Accessibility | **2** | 194 thuộc tính `aria-*`, 45 xử lý phím | `user-scalable=no` chặn phóng to; chưa audit WCAG |
| 10 | Đa ngôn ngữ | **3** | VI/EN đầy đủ, khóa dịch được kiểm tra bằng kiểu (`src/i18n/types.ts`) | Chỉ 2 ngôn ngữ |
| 11 | Phân phối | **2** | PWA cài được; workflow `desktop-release.yml` | Bản desktop cuối là v2.1.0 (tên file 1.0.6), **chưa ký số**, action cũ, `bun` không ghim phiên bản; chưa có store nào live |
| 12 | Vận hành & quan sát | **1** | Worker deploy được, smoke test | Deploy Worker thủ công, không staging, không log/alert, không theo dõi lỗi client |

**Tổng**: 29/60 — nền tảng sản phẩm tốt, lớp thương mại & kỹ thuật chất lượng còn mỏng.

## 3. Điều kiện chặn bán (phải xong trước outreach)

| Chặn | Task |
| :--- | :--- |
| Thương hiệu & metadata SEO sai | [A01](../10-execution-plan/A01-brand-and-seo-metadata-fix.md) |
| Thiếu Điều khoản & Chính sách hoàn tiền | [A02](../10-execution-plan/A02-legal-pages-terms-refund.md) |
| Chưa có MoR chi trả được về VN | [A03](../10-execution-plan/A03-merchant-of-record-onboarding.md) |
| `/claim` yếu, chưa xử lý hoàn tiền | [A04](../10-execution-plan/A04-checkout-webhook-and-claim-hardening.md) |
| Paywall & secret chưa bật | [A05](../10-execution-plan/A05-enable-payments-in-production.md) |
| Không có trang đích/giá tĩnh | [A06](../10-execution-plan/A06-landing-and-pricing-pages.md) |
| Không đo lường | [A07](../10-execution-plan/A07-privacy-friendly-analytics.md) |

## 4. Rủi ro cao nhưng không chặn khách đầu tiên

- Không test tự động → sửa lỗi có thể làm hỏng dữ liệu người dùng mà không biết ([B01](../10-execution-plan/B01-test-suite-in-repo.md)).
- TS không strict, không lint → lỗi kiểu lọt vào production ([B02](../10-execution-plan/B02-lint-format-strict-typescript.md)).
- Không Error Boundary → một lỗi render = app trắng ([B04](../10-execution-plan/B04-error-boundary-and-csp.md)).
- Bản desktop cũ & chưa ký → người dùng tải bản lỗi thời, bị SmartScreen cảnh báo ([D02](../10-execution-plan/D02-desktop-release-pipeline.md); trước mắt ưu tiên Microsoft Store [C05](../10-execution-plan/C05-microsoft-store-submission.md)).

## 5. Lặp lại đánh giá

Chạy lại bảng điểm sau mỗi Phase của kế hoạch thực thi; cập nhật cột *Điểm* và *Bằng chứng* trong cùng PR với thay đổi.
