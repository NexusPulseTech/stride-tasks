# Changelog

All notable changes to Stride Tasks are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Detailed engineering notes for recent versions live in [docs/Release](docs/Release/README.md).

## [Unreleased]

### Added
- A link with `?upgrade=pro` opens the PRO pricing dialog directly, for buy buttons outside the app.
- A recovery screen replaces a blank page when the app crashes. It can reload the app or save a backup file read straight from local storage, which the restore feature can import.

### Changed
- PRO is on sale: the English landing page buy button opens the PRO pricing dialog in the app, and checkout runs through Polar.
- Visitors from Vietnam see the emerging-market price by default while bank transfer payments are not available yet.

### Fixed
- PRO now activates within seconds of a payment instead of up to a minute: paid order records moved from the eventually consistent KV store to D1, and duplicate webhooks can no longer issue a second license.
- The shareable productivity card shows the Stride Tasks name instead of the old product name.

### Security
- Content Security Policy for the web app: only the app's own scripts, its API and privacy-friendly analytics may load. The policy is generated at build time with hashes for inline scripts.
- Styles may only come from the app's own stylesheets, and the app hides itself when another site embeds it in a frame, which blocks clickjacking.
- The site now sends security headers from the edge: framing is refused, MIME sniffing is off, HTTPS is enforced with HSTS, and camera, microphone and location access are disabled.
- Vulnerabilities can be reported privately through GitHub. Dependency alerts, automatic security updates, secret scanning and push protection are on for the repository.

## [3.2.0] - 2026-11-09

### Added
- International card payments through Polar (Merchant of Record): checkout links, a Standard Webhooks order handler, and automatic PRO activation from the post-payment redirect, including purchases started outside the app or on another device.
- English and Vietnamese landing pages with pricing, FAQ and hreflang. The app picks its first language from the landing link or the browser.
- Terms of Service and Refund Policy pages, an updated Privacy Policy, and cookieless web analytics.
- `llms.txt` and an IndexNow submission script for faster search indexing.
- Automated tests for sync, claim polling and license verification, plus Worker tests that run in the Workers runtime. Both run in CI and block deploys when they fail.
- `SECURITY.md` with a private channel for reporting vulnerabilities.
- Developer tooling: a dev-server proxy for local checkout tests and a one-command loader for Worker secrets.

### Changed
- **License:** code from this version on is released under the Functional Source License 1.1 with an MIT future license (`FSL-1.1-MIT`). Each version becomes MIT two years after its release. Versions up to 3.1.0 remain MIT.
- Founding prices for the first 100 PRO licenses: $19 worldwide, $9.95 in emerging markets, 149.000₫ in Vietnam.
- Metadata and branding use the name Stride Tasks everywhere, and pinch-zoom is restored on mobile.
- Feedback emails go to the support address on the product domain and include the app version.
- Desktop builds no longer start on every version tag. They are paused until code signing and auto-update are ready.

### Fixed
- Accent badge contrast now meets WCAG AA.
- The page title is restored when the focus timer is idle.
- A Polar order is recognized as fully refunded even when the tax portion is refunded separately.
- Webhook secrets are trimmed before use, so a stray newline no longer rejects every webhook.

### Security
- Claiming a license requires a secret held only by the buying device. Claim polling backs off and stops. Refunded licenses are revoked from sync. Claims, orders and sync writes are rate limited.

## [3.1.0] - 2026-10-29

### Added
- End-to-end encrypted multi-device sync for PRO: data is encrypted on the device with AES-256-GCM, the server stores only ciphertext, and devices connect with a sync code or link.
- Microsoft Store listing kit (screenshots and store copy).

### Changed
- The Kanban board and the Pomodoro timer with its deep-work log are now free.
- The free plan allows 5 projects (up from 3) and 3 Markdown report exports.

## [3.0.0] - 2026-10-27

### Added
- Execution engine: one-line quick capture with natural syntax (for example `~45m @daily !pin`), a 4-column Kanban board, a Pomodoro timer with a deep-work log, time budgets, Markdown reports and a command palette.
- PRO licenses verified offline with Ed25519 signatures. The paywall is off by default.

### Changed
- New red Stride Tasks logo and social preview image.

### Fixed
- Issues found in a P0 to P2 code audit.

## [2.5.0] - 2026-10-17

### Added
- Daily focus queue for spaced-repetition reviews.

### Changed
- Layered stacking for menus and dialogs, and responsive layout improvements.

### Fixed
- Spaced repetition for subtasks.

### Removed
- Source code ZIP download.

## [2.4.0] - 2026-10-14

### Added
- Spaced repetition based on the SM-2 algorithm, with automatic reminders.

### Changed
- Interface updates without layout shift.

## [2.3.0] - 2026-10-13

### Added
- Editing of nested subtasks and pinnable subtasks.

### Changed
- Expanded English and Vietnamese translations.

## [2.2.0] - 2026-10-11

### Changed
- Consolidated and verified the core feature set: local storage with a snapshot vault, three-level drag and drop (project, task, subtask), pinned tasks, smart scheduling, status categories, and the activity heatmap with streaks.

## [2.1.0] - 2026-10-07

### Added
- Persistent storage layer with a snapshot vault.
- Recurring tasks.
- Redesigned backup and restore dialog.
- Search metadata, sitemap and custom domain for tasks.nexuspulsetech.xyz.

### Changed
- Reworked subtask rows and task menus.

## [1.0.6] - 2026-10-03

### Added
- Status categories.
- Recursive quick paste.

## [1.0.5] - 2026-10-03

### Added
- Full snapshot backup including task history and the heatmap.

## [1.0.4] - 2026-10-03

### Changed
- Improved status popover and subtask tree.

## [1.0.3] - 2026-10-02

### Changed
- Responsive minimal header and English and Vietnamese interface.

### Fixed
- Layout shift and deleting history entries.

### Removed
- Source ZIP download button.

## [1.0.2] - 2026-09-29

### Changed
- Official Windows desktop installer with aligned version numbers.

## [1.0.1] - 2026-09-29

### Fixed
- Desktop build pipeline for the Windows installer.

## [1.0.0] - 2026-09-28

### Added
- First release: local-first task manager with recursive subtasks, a todo, doing, done workflow, an activity heatmap with completion log, productivity reports, and a Windows desktop app.

[Unreleased]: https://github.com/NexusPulseTech/stride-tasks/compare/v3.2.0...HEAD
[3.2.0]: https://github.com/NexusPulseTech/stride-tasks/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/NexusPulseTech/stride-tasks/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/NexusPulseTech/stride-tasks/compare/v2.5.0...v3.0.0
[2.5.0]: https://github.com/NexusPulseTech/stride-tasks/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/NexusPulseTech/stride-tasks/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/NexusPulseTech/stride-tasks/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/NexusPulseTech/stride-tasks/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/NexusPulseTech/stride-tasks/compare/v1.0.6...v2.1.0
[1.0.6]: https://github.com/NexusPulseTech/stride-tasks/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/NexusPulseTech/stride-tasks/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/NexusPulseTech/stride-tasks/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/NexusPulseTech/stride-tasks/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/NexusPulseTech/stride-tasks/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/NexusPulseTech/stride-tasks/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/NexusPulseTech/stride-tasks/releases/tag/v1.0.0
