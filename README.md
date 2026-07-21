# AutoMechanic

مخزن تولید مرحله‌ای **«مکانیک خودرو عمومی — برگرفته از آموزه‌های استاد نصیری»**؛ بازآرایی کامل مجموعهٔ ۲۰ مقاله به یک منبع آموزشی دانشگاهی فارسی با خروجی هماهنگ وب و PDF.

## وضعیت پروژه

| مرحله | وضعیت |
|---|---|
| Phase 1 — Source Audit | کامل؛ ۲۰/۲۰ منبع و ۱۹۶ مفهوم ممیزی/نگاشت شده‌اند |
| Phase 2 — Architecture Proposal | کامل، کامیت‌شده و مصوب |
| Approval Gate 1 | **تصویب‌شده در ۲۰۲۶-۰۷-۲۱** |
| Phase 3 — Representative Sample | **corrective pass کامل؛ baseline نخست رد شده؛ در انتظار Approval Gate 2** |
| Approval Gate 2 | corrective sample آمادهٔ بازبینی؛ هنوز تصویب نشده است |
| Phase 4 — Full Production | آغاز نشده؛ تا Approval Gate 2 ممنوع |

شاخهٔ این مرحله: `workgpt/sample-module`.

## اسناد Gate 1

- [`SOURCE_INVENTORY.md`](SOURCE_INVENTORY.md) — وضعیت دریافت/استخراج، مضمون و پیچیدگی هر ۲۰ منبع؛
- [`CONTENT_COVERAGE_MATRIX.md`](CONTENT_COVERAGE_MATRIX.md) — نگاشت ۱۹۶ مفهوم به ماژول و section؛
- [`ISSUE_LEDGER.md`](ISSUE_LEDGER.md) — خطاها، ابهام‌ها، تصمیم‌های A–D و موانع؛
- [`RESEARCH_LOG.md`](RESEARCH_LOG.md) — شواهد فنی و انتشار از منابع معتبر؛
- [`ARCHITECTURE_PROPOSAL.md`](ARCHITECTURE_PROPOSAL.md) — معماری ده‌ماژولی، اهداف، stack، وب/PDF، حجم، مراحل و ریسک؛
- [`PROJECT_SPEC.md`](PROJECT_SPEC.md) — خط مبنای دامنه، زبان، RTL، رسانه، gate و حدود اختیار؛
- [`MEDIA_SOURCES.md`](MEDIA_SOURCES.md) — سیاست حقوق/رسانه، بررسی شش شکل ردشده و manifest سه رسانهٔ مجاز M08؛
- [`TEST_PLAN.md`](TEST_PLAN.md) — آزمون پوشش، علم، فارسی، bidi، وب، PDF و بازتولیدپذیری؛
- [`PHASE3_AUDIT.md`](PHASE3_AUDIT.md) — شاهد build، خودممیزی M08 و تصمیم‌های لازم در Gate 2؛
- [`CHANGELOG.md`](CHANGELOG.md) — نقاط عطف و تغییرات معنی‌دار.

شاخص قطعی منابع در [`sources/baseContentLinks.txt`](sources/baseContentLinks.txt) نگهداری می‌شود. S19 از URL اصلاح‌شدهٔ همان فایل استفاده می‌کند.

## ممیزی قابل اجرا

نیاز فعلی: Node.js 20 یا جدیدتر و دسترسی HTTPS به `ameg.ir`. وابستگی npm وجود ندارد.

```bash
git switch workgpt/sample-module
node scripts/audit-sources.mjs
node scripts/audit-sources.mjs --json
```

فرمان باید ۲۰ ردیف `accessed` برگرداند؛ خروج non-zero به معنی منبع ناموفق/ناقص است. شمارش واژه/تصویر فقط سیگنال audit است و متن منبع در مخزن ذخیره نمی‌شود.

کنترل‌های محلی Gate 1:

```bash
node --check scripts/audit-sources.mjs
git diff --check
```

## پشتهٔ اثبات‌شده و pin پیشنهادی Gate 2

- Quarto Book 1.9.38 و Pandoc 3.8.3 به‌عنوان مسیر مشترک `.qmd`؛
- HTML ایستا + CSS logical/RTL + JavaScript کمینه؛
- XeLaTeX در TeX Live 2023 + XePersian 24.8 برای PDF رسمی؛
- Vazirmatn 33.0.3 به‌صورت محلی برای وب و PDF و MathML بومی مرورگر برای معادلات وب؛
- BibTeX برای رکوردهای ممیزی و نشانگرهای عددی QMD برای ارجاع خوانای مشترک؛ YAML برای اصطلاح‌نامه/رسانه/سنجش داخلی؛
- Node.js ≥20 با lockfile؛ Playwright 1.61.1، Chromium 149 و Firefox ESR 140.12 برای مرورگر؛
- qpdf/Poppler برای preflight و رندر PDF.

نمونه از آزمون RTL، حروف‌چینی فارسی، پاورقی، وب responsive و PDF رسمی عبور کرده است؛ نسخه‌های بالا اکنون در lockfile و bootstrap با checksum ثبت شده‌اند و برای تثبیت در Gate 2 پیشنهاد می‌شوند. دلیل انتخاب و گزینه‌های کنارگذاشته‌شده در [`ARCHITECTURE_PROPOSAL.md`](ARCHITECTURE_PROPOSAL.md) آمده است.

## قرارداد فرمان‌های Phase 3

این interface در Phase 3 پیاده‌سازی و با build واقعی راستی‌آزمایی شده است.

| کار | فرمان مصوب |
|---|---|
| نصب ابزارهای Node | `npm ci` |
| پیش‌نمایش محلی | `npm run dev` |
| ساخت وب | `npm run build:web` |
| ساخت PDF | `npm run build:pdf` |
| ساخت هر دو | `npm run build` |
| تست کامل | `npm test` |
| تست دیداری | `npm run test:visual` |
| ممیزی پوشش | `npm run audit:coverage` |

محل خروجی: `_output/web/` و `_output/pdf/auto-mechanic-fa.pdf`.

راه‌اندازی clone محلی:

```bash
npm ci
npm run bootstrap:tools
npm run setup:browsers
npm test
```

مسیر PDF به XeLaTeX میزبان نیاز دارد؛ baseline اثبات‌شده TeX Live 2023 است.

## ساختار نمونهٔ Phase 3

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
├── PHASE3_AUDIT.md
├── CHANGELOG.md
├── _quarto.yml
├── index.qmd
├── content/{m08,m08-answers,glossary,references}.qmd
├── assets/{css,js,fonts,media}/
├── data/{m08-coverage,m08-assessment,glossary}.yml
├── references/references.bib
├── print/preamble.tex
├── filters/rtl.lua
├── scripts/{build,test-content,test-web,test-pdf}.mjs
└── sources/
    └── baseContentLinks.txt
```

درخت تولیدی فقط به‌اندازهٔ نمونهٔ M08 ساخته شده است. ایجاد ماژول‌های دیگر پیش از Gate 2 ممنوع است.

## رسانه

۱۵۸ تصویر در مقالات شناسایی شده‌اند، اما به‌صورت پیش‌فرض بازنشر نمی‌شوند. تصویر مکانیکی AI و هندسهٔ قطعهٔ برنامه‌ساخته مجاز نیست. اولویت با رسانهٔ فنی دقیق موجود و دارای مجوز روشن و ثبت کامل است؛ در نبود آن، متن، معادله، جدول، توالی یا جریان واقعاً انتزاعی استفاده می‌شود. متن مقاله‌ها مبنای برنامهٔ درسی برای بازنویسی تحول‌آفرین است و عبارت‌های طولانی آن‌ها عیناً بازتولید نمی‌شود.

## انتشار و تحویل مرحله‌ای

- اتصال GitHub فقط برای خواندن است؛ هیچ write، push، branch، commit، PR یا permission troubleshooting از طریق آن انجام نمی‌شود.
- توسعه، شاخه‌بندی و کامیت‌های معنی‌دار در مخزن محلی انجام می‌شوند.
- پایان هر phase مصوب با ZIP کامل مخزن، patch یکپارچهٔ تغییرات phase، Git bundle تاریخچه و manifest تحویل می‌شود؛ مالک پروژه آن‌ها را دستی به GitHub منتقل می‌کند.

## آزمون

آزمون L1 corrective sample در کنار شواهد Gate 1 اجرا شده است. baseline نخست
۲۵صفحه‌ای با وجود pass خودکار در human review رد شد و ادعای قبولی دیداری آن در
`PHASE3_AUDIT.md` پس گرفته شده است. نتیجهٔ artifact اصلاحی:

- ۳۴/۳۴ کنترل محتوا، پوشش، محاسبه، اصطلاح، citation و رسانه؛
- ۷۶/۷۶ کنترل خودکار وب در Chromium و Firefox، پنج profile، keyboard، JavaScript-off، print، لینک منابع و axe؛
- ۲۷/۲۷ کنترل PDF؛ ۲۲ صفحهٔ A4، ۱۶۳ مقصد داخلی، ۶ رکورد فونت embedded/subset، صفر صفحهٔ سفید، missing glyph و overfull box؛
- بازبینی دیداری صفحه‌به‌صفحهٔ هر ۲۲ صفحهٔ PDF اصلاحی؛
- صفر SVG ردشده، شناسهٔ داخلی، author–date، `n.d.` یا URL خام در PDF دانشجو؛
- ۲۹/۲۹ مفهوم M08 از S12–S15 با anchor واقعی و وضعیت `Sample verified`.
- build مستقل از clone تمیز؛ وب file-for-file و PDF byte-for-byte یکسان با
  SHA-256 `98e4e12772c5830aa8f432e96c0559715c73fb98b2c2d0d289994c8ffca4dc66`.

نتیجهٔ وب فقط build و sanity خودکار است. طبق تصمیم کاربر، human audit مستقل وب
به Codex واگذار شده و این مرحله هیچ ادعای approval انسانی وب ندارد.

جزئیات و معیارهای pass/fail در [`TEST_PLAN.md`](TEST_PLAN.md) و نتیجهٔ امضاشده در [`PHASE3_AUDIT.md`](PHASE3_AUDIT.md) است.

## محدودیت‌ها و مسائل باز

- pin دقیق stack و template بصری در Gate 2 نیازمند تصویب است؛
- XeLaTeX کامل هنوز dependency میزبان است؛ bootstrap، Quarto/Pandoc/XePersian و ابزارهای آزمون را pin می‌کند؛
- WebKit به L3/full regression موکول است؛ L1 در Chromium و Firefox عبور کرده است؛
- تصاویر مبدأ بدون مجوز روشن بازنشر نمی‌شوند؛
- تولید کامل، ماژول‌های دیگر و `CODEX_AUDIT_BRIEF.md` پیش از Gate 2/Phase 6 مجاز نیستند؛
- `CODEX_AUDIT_BRIEF.md` عمداً تا Phase 6 ایجاد نمی‌شود؛ پیش از build واقعی، command/output جعلی می‌ساخت؛
- انتشار GitHub دستی است و `PUB-001` با workflow تحویل artifact حل شده است.

هیچ merge به `main` و هیچ آغاز Phase 4 بدون تأیید صریح Gate 2 انجام نمی‌شود.
