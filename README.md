# AutoMechanic

مخزن تولید مرحله‌ای **«مکانیک خودرو عمومی — برگرفته از آموزه‌های استاد نصیری»**؛ بازآرایی کامل مجموعهٔ ۲۰ مقاله به یک منبع آموزشی دانشگاهی فارسی با خروجی هماهنگ وب و PDF.

## وضعیت پروژه

| مرحله | وضعیت |
|---|---|
| Phase 1 — Source Audit | کامل؛ ۲۰/۲۰ منبع و ۱۹۶ مفهوم ممیزی/نگاشت شده‌اند |
| Phase 2 — Architecture Proposal | کامل و کامیت‌شده؛ در انتظار تصویب |
| Approval Gate 1 | **توقف فعال** |
| نمونه، وب، PDF و تولید کامل | آغاز نشده‌اند؛ بدون اجازهٔ صریح ممنوع |

شاخهٔ این مرحله: `workgpt/architecture`.

## اسناد Gate 1

- [`SOURCE_INVENTORY.md`](SOURCE_INVENTORY.md) — وضعیت دریافت/استخراج، مضمون و پیچیدگی هر ۲۰ منبع؛
- [`CONTENT_COVERAGE_MATRIX.md`](CONTENT_COVERAGE_MATRIX.md) — نگاشت ۱۹۶ مفهوم به ماژول و section؛
- [`ISSUE_LEDGER.md`](ISSUE_LEDGER.md) — خطاها، ابهام‌ها، تصمیم‌های A–D و موانع؛
- [`RESEARCH_LOG.md`](RESEARCH_LOG.md) — شواهد فنی و انتشار از منابع معتبر؛
- [`ARCHITECTURE_PROPOSAL.md`](ARCHITECTURE_PROPOSAL.md) — معماری ده‌ماژولی، اهداف، stack، وب/PDF، حجم، مراحل و ریسک؛
- [`PROJECT_SPEC.md`](PROJECT_SPEC.md) — خط مبنای دامنه، زبان، RTL، رسانه، gate و حدود اختیار؛
- [`MEDIA_SOURCES.md`](MEDIA_SOURCES.md) — سیاست حقوق/رسانه و ۳۴ نیاز؛ فعلاً هیچ رسانه‌ای ادغام نشده؛
- [`TEST_PLAN.md`](TEST_PLAN.md) — آزمون پوشش، علم، فارسی، bidi، وب، PDF و بازتولیدپذیری؛
- [`CHANGELOG.md`](CHANGELOG.md) — نقاط عطف و تغییرات معنی‌دار.

شاخص قطعی منابع در [`sources/baseContentLinks.txt`](sources/baseContentLinks.txt) نگهداری می‌شود. S19 از URL اصلاح‌شدهٔ همان فایل استفاده می‌کند.

## ممیزی قابل اجرا

نیاز فعلی: Node.js 20 یا جدیدتر و دسترسی HTTPS به `ameg.ir`. وابستگی npm وجود ندارد.

```bash
git switch workgpt/architecture
node scripts/audit-sources.mjs
node scripts/audit-sources.mjs --json
```

فرمان باید ۲۰ ردیف `accessed` برگرداند؛ خروج non-zero به معنی منبع ناموفق/ناقص است. شمارش واژه/تصویر فقط سیگنال audit است و متن منبع در مخزن ذخیره نمی‌شود.

کنترل‌های محلی Gate 1:

```bash
node --check scripts/audit-sources.mjs
git diff --check
```

## پشتهٔ پیشنهادی — هنوز پیاده‌سازی نشده

- Quarto Book 1.9 به‌عنوان منبع مشترک `.qmd`؛
- HTML ایستا + CSS logical/RTL + JavaScript کمینه؛
- XeLaTeX + XePersian برای PDF رسمی؛
- BibTeX/CSL برای ارجاع؛ YAML برای اصطلاح‌نامه/رسانه؛
- Node.js برای lint/coverage و Playwright + axe برای مرورگر؛
- qpdf/Poppler برای preflight و رندر PDF.

نسخهٔ دقیق ابزارها پس از اثبات ماژول نمونه در Gate 2 pin می‌شود. دلیل انتخاب و گزینه‌های کنارگذاشته‌شده در [`ARCHITECTURE_PROPOSAL.md`](ARCHITECTURE_PROPOSAL.md) آمده است.

## قرارداد فرمان‌های آینده

این فرمان‌ها interface مصوب پیشنهادی‌اند، **نه فرمان‌های موجود در Gate 1**. `package.json`، پروژهٔ Quarto یا template PDF عمداً هنوز ساخته نشده‌اند.

| کار | فرمان پیشنهادی پس از Phase 3 |
|---|---|
| نصب ابزارهای Node | `npm ci` |
| پیش‌نمایش محلی | `npm run dev` |
| ساخت وب | `npm run build:web` |
| ساخت PDF | `npm run build:pdf` |
| ساخت هر دو | `npm run build` |
| تست کامل | `npm test` |
| تست دیداری | `npm run test:visual` |
| ممیزی پوشش | `npm run audit:coverage` |

محل خروجی پیشنهادی: `_output/web/` و `_output/pdf/auto-mechanic-fa.pdf`. این مسیرها تا تصویب/پیاده‌سازی وجود ندارند.

## ساختار فعلی

```text
.
├── README.md
├── PROJECT_SPEC.md
├── ARCHITECTURE_PROPOSAL.md
├── SOURCE_INVENTORY.md
├── CONTENT_COVERAGE_MATRIX.md
├── ISSUE_LEDGER.md
├── RESEARCH_LOG.md
├── MEDIA_SOURCES.md
├── TEST_PLAN.md
├── CHANGELOG.md
├── scripts/
│   └── audit-sources.mjs
└── sources/
    └── baseContentLinks.txt
```

درخت تولیدی `content/`, `assets/`, `data/`, `print/`, `references/` و `tests/` فقط پس از Gate 1 ساخته می‌شود تا این شاخه ناخواسته وارد نمونه/پیاده‌سازی نشود.

## رسانه

۱۵۸ تصویر در مقالات شناسایی شده، اما هیچ‌کدام کپی یا ادغام نشده است. دسترسی عمومی مجوز بازنشر نیست. هر رسانهٔ آینده باید منبع، خالق، URL، مجوز، فایل محلی، کاربرد، treatment PDF، alt/caption، checksum و وضعیت بازبینی داشته باشد. سیاست پیش‌فرض تا تصمیم کاربر: عدم بازنشر تصویر مبدأ و استفاده از شکل سادهٔ اصیل یا رسانهٔ دارای مجوز روشن.

## آزمون

آزمون Gate 1 دسترسی ۲۰/۲۰، syntax اسکریپت، حضور S00–S19 و ۱۹۶ Coverage ID را پوشش می‌دهد. برنامهٔ کامل شامل:

- correctness معادله/جهت/توالی و issueهای A–D؛
- lint فارسی و اصطلاح‌نامه/footnote؛
- fixtureهای واقعی RTL و متن فارسی–انگلیسی؛
- پنج viewport، keyboard، axe و visual regression؛
- لینک، رسانه، performance و build تمیز؛
- qpdf/pdftotext/pdffonts، رندر همه صفحات و بازبینی چاپ/grayscale.

جزئیات و معیارهای pass/fail در [`TEST_PLAN.md`](TEST_PLAN.md) است.

## محدودیت‌ها و مسائل باز

- ساختار ۱۰ ماژولی و stack هنوز به تصویب Gate 1 نرسیده است؛
- حق اقتباس متن و تصاویر باید توسط مالک پروژه روشن شود؛
- بازسازی CVT و طبقه‌بندی تعلیق تصمیم محتوایی ردهٔ D هستند؛
- میزان مرور ADAS و سطح محاسبات نیازمند تأیید است؛
- وب/PDF/sample وجود ندارد، بنا بر دستور توقف؛
- `CODEX_AUDIT_BRIEF.md` عمداً تا Phase 6 ایجاد نمی‌شود؛ پیش از build واقعی، command/output جعلی می‌ساخت؛
- انتشار شاخه به GitHub به دسترسی نوشتن اتصال بستگی دارد؛ وضعیت جاری در `PUB-001` ثبت شده است.

هیچ merge به `main` و هیچ آغاز Phase 3 بدون تأیید صریح انجام نمی‌شود.
