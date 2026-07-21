# AutoMechanic

مخزن تولید **«مکانیک خودرو عمومی — برگرفته از آموزه‌های استاد نصیری»**؛ بازآرایی یکپارچهٔ ۲۰ مقاله در ده ماژول دانشگاهی فارسی با یک منبع QMD مشترک برای وب ایستا و PDF رسمی.

## وضعیت پروژه

| مرحله | وضعیت |
|---|---|
| Phase 1 — Source Audit | کامل؛ ۲۰/۲۰ منبع و ۱۹۶ مفهوم ممیزی و نگاشت شدند |
| Phase 2 — Architecture | کامل و مصوب |
| Phase 3 — M08 Sample | corrective baseline کامل، تصویب و دستی روی GitHub منتشر شد |
| Approval Gate 2 | تصویب‌شده در ۲۰۲۶-۰۷-۲۱ |
| Phase 4 — Full Production | کامل؛ M01–M10 و backmatter ساخته شدند |
| Phase 5 — Self-Audit | کامل؛ defectهای درون اختیار اصلاح و کنترل‌ها بازاجرا شدند |
| Phase 6 — Codex Preparation | کامل؛ قرارداد عملیاتی بازرسی آماده است |
| Independent Codex Audit | **اجرا نشده؛ مرحلهٔ بعدی مالک پروژه** |

توسعهٔ نهایی روی شاخهٔ محلی `workgpt/full-production` و بر پایهٔ commit منتشرشدهٔ اصلاحی Phase 3، یعنی `489676f9c9cff998204eb0904f28905057ed6571`، انجام شده است. اتصال GitHub در تمام این کار فقط‌خواندنی ماند.

## محصول نهایی WorkGPT

- ده ماژول و ۱۴ صفحهٔ HTML ایستا؛
- ۲۰/۲۰ منبع و ۱۹۶/۱۹۶ مفهوم در anchorهای واقعی با وضعیت `Published`؛
- حدود ۳۰٬۱۳۲ واژهٔ منبع آموزشی؛
- ۵۳ پرسش جدی و ۵۳ پاسخ تشریحی؛
- ۱۳ مثال عددی باز‌محاسبه‌شده؛
- ۱۳۸ پاورقی نخستین‌کاربرد اصطلاح؛
- واژه‌نامهٔ یکپارچهٔ ۱۲۴مدخلی و ۳۹ رکورد منبع پیونددار؛
- سه رسانهٔ فنی public-domain/CC0 با manifest، attribution و checksum؛
- PDF رسمی ۱۱۱صفحه‌ای A4 با ۸۱۵ مقصد داخلی و شش فونت embedded/subset.

خروجی‌ها در `_output/web/` و `_output/pdf/auto-mechanic-fa.pdf` قرار دارند. QMDهای `index.qmd` و `content/*.qmd` منبع حقیقت هر دو خروجی‌اند.

## پشتهٔ تثبیت‌شده

- Quarto 1.9.38 و Pandoc 3.8.3؛
- XeLaTeX در TeX Live 2023 و XePersian 24.8؛
- Vazirmatn 33.0.3؛
- Node.js 20 یا جدیدتر، Playwright 1.61.1 و axe-core 4.12.1؛
- Chromium 149، Firefox ESR 140.12، qpdf و Poppler.

XeLaTeX میزبان همچنان dependency مستند است. wrapper کمینهٔ `scripts/bin/xelatex` همان موتور میزبان را در پوشهٔ موقت اجرا می‌کند تا فایل‌های کمکی بزرگ در محیط‌های workspace قطع نشوند؛ موتور یا قالب جایگزین نمی‌شود.

## راه‌اندازی و فرمان‌ها

```bash
npm ci
npm run bootstrap:tools
npm run setup:browsers
npm test
```

| کار | فرمان |
|---|---|
| پیش‌نمایش محلی | `npm run dev` |
| ساخت وب | `npm run build:web` |
| ساخت PDF | `npm run build:pdf` |
| ساخت هر دو | `npm run build` |
| تست محتوا و پوشش | `npm run test:content` |
| تست وب | `npm run test:web` |
| تست PDF و رندر همهٔ صفحات | `npm run test:pdf` |
| تست کامل | `npm test` |
| ممیزی پوشش | `npm run audit:coverage` |

## نتیجهٔ خودممیزی WorkGPT

| حوزه | نتیجه | شاهد |
|---|---:|---|
| محتوا، پوشش، سنجش، اصطلاح و رسانه | ۳۶/۳۶ | `artifacts/qa/phase5/content-audit.json` |
| وب عملکردی و responsive | ۵۶/۵۶ | `artifacts/qa/phase5/web-audit.json` |
| PDF، فونت، متن، مقصد و رندر | ۵۳/۵۳ | `artifacts/qa/phase5/pdf-audit.json` |
| **کل** | **۱۴۵/۱۴۵** | `SELF_AUDIT_REPORT.md` |

هر ۱۱۱ صفحهٔ PDF با Poppler رندر، decode و در ۲۸ contact sheet مشاهده شد. نتیجهٔ وب، build و sanity خودکار است؛ هیچ تصویب زیبایی‌شناختی انسانی برای وب ادعا نمی‌شود و آن بررسی صریحاً به Codex مستقل واگذار شده است.

## اسناد اصلی

- [`PROJECT_SPEC.md`](PROJECT_SPEC.md) — دامنه، زبان، RTL، رسانه، gate و حدود اختیار؛
- [`ARCHITECTURE_PROPOSAL.md`](ARCHITECTURE_PROPOSAL.md) — معماری آموزشی و فنی؛
- [`SOURCE_INVENTORY.md`](SOURCE_INVENTORY.md) و [`CONTENT_COVERAGE_MATRIX.md`](CONTENT_COVERAGE_MATRIX.md) — موجودی و ردیابی ۱۹۶ مفهوم؛
- [`ISSUE_LEDGER.md`](ISSUE_LEDGER.md) و [`RESEARCH_LOG.md`](RESEARCH_LOG.md) — اصلاح‌ها، تصمیم‌ها و شواهد؛
- [`MEDIA_SOURCES.md`](MEDIA_SOURCES.md) و [`MEDIA_LICENSING_SUMMARY.md`](MEDIA_LICENSING_SUMMARY.md) — سیاست، manifest و خلاصهٔ حقوق؛
- [`TEST_PLAN.md`](TEST_PLAN.md)، [`SOURCE_COMPLETENESS_REPORT.md`](SOURCE_COMPLETENESS_REPORT.md) و [`SELF_AUDIT_REPORT.md`](SELF_AUDIT_REPORT.md) — معیارها و نتیجهٔ Phase 5؛
- [`UNRESOLVED_ISSUES.md`](UNRESOLVED_ISSUES.md) — محدودیت‌های صادقانهٔ باقی‌مانده؛
- [`CODEX_AUDIT_BRIEF.md`](CODEX_AUDIT_BRIEF.md) — قرارداد عملیاتی Phase 6 برای بازرس مستقل؛
- [`MANUAL_IMPORT_PUSH.md`](MANUAL_IMPORT_PUSH.md) — واردکردن تاریخچه و push دستی.

## ساختار کلیدی

```text
AutoMechanic/
├── index.qmd
├── content/{m01..m10,answers,glossary,references}.qmd
├── data/{m01..m10-coverage,*-assessment,glossary,media}.yml
├── assets/{css,js,fonts,media}/
├── references/references.bib
├── print/preamble.tex
├── scripts/{build,test-content,test-web,test-pdf}.mjs
├── artifacts/qa/phase5/
└── _output/{web,pdf}/
```

## رسانه و انتشار

هیچ تصویر مقالهٔ مبدأ، تصویر مکانیکی AI یا هندسهٔ مکانیکی شبه‌واقعیِ برنامه‌ساخته در محصول نیست. تنها سه رسانهٔ فنی دارای حق روشن استفاده شده‌اند؛ در نبود رسانهٔ کافی، متن، معادله، جدول یا توالی عملیاتی ترجیح داده شده است.

GitHub فقط‌خواندنی است. تاریخچهٔ محلی، ZIP، patch، bundle و manifest برای انتقال دستی مالک تحویل می‌شوند؛ هیچ push، PR، branch remote یا permission troubleshooting از این محیط انجام نشده است.

## محدودیت‌های مهم

- human-style audit کامل وب هنوز اجرا نشده و وظیفهٔ Codex مستقل است؛
- WebKit در خودممیزی WorkGPT اجرا نشده است؛
- Firefox headless برای درخواست ۳۹۰px در این میزبان client width برابر ۴۳۸px می‌دهد؛ عرض دقیق ۳۶۰/۳۹۰ در Chromium پوشش دارد؛
- XeLaTeX کامل hermetic نیست و باید روی میزبان در دسترس باشد؛
- بازرسی Codex و `CODEX_AUDIT_REPORT.md` هنوز وجود ندارند و نباید نتیجهٔ آن‌ها پیشاپیش فرض شود.
