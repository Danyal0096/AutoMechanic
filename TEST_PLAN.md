# برنامهٔ آزمون و تضمین کیفیت

> نسخهٔ اصلاحی Phase 3 — آزمون L1 نمونهٔ M08 پس از رد baseline نخست دوباره اجرا
> شده است؛ Approval Gate 2 هنوز تصویب نشده است.

## هدف و اصل شواهد

کیفیت این پروژه فقط با موفقیت build اثبات نمی‌شود. پذیرش به پنج نوع شاهد نیاز دارد:

1. ردیابی کامل ۲۰ منبع و ۱۹۶ مفهوم؛
2. بازبینی علمی/مکانیکی و بسته‌شدن issueها؛
3. نوشتار فارسی و اصطلاحات سازگار؛
4. رندر واقعی وب/PDF، به‌ویژه RTL و bidi؛
5. build تمیز و بازتولیدپذیر با لینک/رسانه/سنجش سالم.

هر تست یکی از وضعیت‌های `pass`، `fail`، `blocked` یا `not run` دارد. «به نظر خوب می‌رسد» نتیجهٔ قابل ثبت نیست؛ تست بصری باید viewport/page و artifact شاهد داشته باشد.

## خط مبنای Gate 1 و نتیجهٔ اصلاحی Phase 3

نتیجهٔ خودکار baseline نخست (۲۸/۷۱/۲۵ pass) تاریخی است و به معنی قبولی دیداری
نبود. ادعای «۲۵ صفحه بدون نقص معنی‌دار» پس از بازبینی کاربر پس گرفته شد. جدول
زیر فقط artifact اصلاح‌شده را گزارش می‌کند.

| Check | روش | نتیجهٔ 2026-07-21 |
|---|---|---|
| تعداد URLهای آموزشی canonical | parser در `scripts/audit-sources.mjs`، با حذف صفحهٔ مادر | Pass — ۲۰ |
| دسترسی و استخراج بدنه | WordPress public record؛ حداقل عنوان و بدنهٔ معتبر | Pass — ۲۰/۲۰ |
| S19 corrected URL | همان URL جاری در source index | Pass |
| syntax اسکریپت | `node --check scripts/audit-sources.mjs` | Pass |
| حضور همهٔ Source IDها در matrix | جست‌وجوی S00–S19 | Pass — ۲۰/۲۰ |
| شمارش ردیف مفهوم | regex روی IDهای coverage | Pass — ۱۹۶ |
| whitespace/error patch | `git diff --check` پیش از commit | Pass |
| پوشش نمونهٔ M08 | `npm run test:content` | Pass — ۲۹/۲۹ مفهوم؛ ۳۴/۳۴ کنترل |
| وب responsive و RTL | `npm run test:web` | Pass خودکار — ۷۶/۷۶ کنترل در Chromium و Firefox |
| PDF رسمی | `npm run test:pdf` | Pass خودکار — ۲۷/۲۷ کنترل؛ ۲۲ صفحهٔ A4 |
| بازبینی دیداری PDF اصلاحی | ۶ contact sheet + بزرگ‌نمایی صفحه‌های حساس | Pass اصلاحی — هر ۲۲ صفحه بررسی شد |
| بازبینی انسانی وب | مطابق تصمیم کاربر | Deferred to Codex؛ هیچ ادعای approval انسانی وب وجود ندارد |

فرمان ممیزی زنده:

```bash
node scripts/audit-sources.mjs
```

این فرمان به شبکه و در دسترس بودن AMEG وابسته است؛ در CI کامل می‌تواند scheduled/non-blocking باشد. snapshot ساختاریِ منبع و matrix باید معیار قطعی build باشد تا outage بیرونی release را بی‌دلیل متوقف نکند.

## سطوح آزمون

| سطح | زمان | دامنه |
|---|---|---|
| L0 — Architecture | اکنون | منبع، matrix، issue، ساختار و تصمیم‌ها |
| L1 — Sample | Phase 3 | یک ماژول سخت در HTML/PDF؛ اثبات stack، bidi، media و assessment |
| L2 — Content batch | Phase 4A–D | هر batch: پوشش، علم، زبان، glossary، build و رندر منتخب |
| L3 — Full regression | Phase 5 | کل سایت و PDF؛ تمام صفحات/viewportها و performance/accessibility |
| L4 — Independent audit | Phase 6 | قرارداد `CODEX_AUDIT_BRIEF.md` و بازبینی مستقل |

## ۱. پوشش منبع و دامنه

### کنترل خودکار

- parser دقیقاً ۲۰ URL آموزشی یکتا پس از صفحهٔ مادر بیابد؛
- هر Source ID از S00 تا S19 در inventory و matrix حضور داشته باشد؛
- هر ردیف matrix شناسه یکتا، ماژول/section معتبر و status مجاز داشته باشد؛
- هر section نهایی دست‌کم یک Coverage ID و هر Coverage ID نهایی یک anchor خروجی داشته باشد؛
- status در چرخهٔ `Mapped → Drafted → Technical reviewed → Language reviewed → Published` فقط رو به جلو باشد مگر reason ثبت شود؛
- حذف section باعث orphan Coverage ID و شکست build شود؛
- source word count فقط anomaly detector است، نه معیار پوشش.

### کنترل انسانی

- مطالعهٔ source-by-source در کنار متن نهایی و امضای پوشش؛
- بررسی اینکه ادغام تکرار، مفهوم مستقل را حذف نکرده است؛
- بازرسی rejected expansion برای جلوگیری از creep؛
- گزارش پوشش: تعداد کل، published، open clarification و درصد بر اساس ID؛ «۱۰۰٪» فقط با صفر orphan.

## ۲. صحت مکانیکی و علمی

برای هر ماژول یک checklist امضاشونده:

- جهت جریان نیرو/سیال/اطلاعات و توالی حالت‌ها؛
- تعریف کمیت، symbol، واحد و قرارداد نسبت؛
- محاسبهٔ مستقل example و answer key؛
- تفکیک مدل ایده‌آل از اتلاف/بازده واقعی؛
- تفکیک مقدار عمومی از specification خودرو؛
- نشانه ≠ علت قطعی و DTC ≠ دستور تعویض؛
- سازگاری متن، figure، caption، alt و سؤال؛
- evidence برای هر correction ردهٔ A/B و تصمیم ثبت‌شده برای C/D؛
- عدم توصیهٔ ناایمن (رادیاتور داغ، خودرو مهارنشده، مدار برق/سوخت).

محاسبات حساس حداقل دوبار با روش مستقل کنترل می‌شوند: ۷۲۰/تعداد سیلندر، نسبت تراکم، نسبت دنده/جهت، توان–گشتاور–بازده، فشار هیدرولیک، گشتاور ترمز و حد اصطکاک. در M08، معادله/جدول عددی CVT gate اختصاصی دارد؛ شکل هندسی ساختگی مجاز نیست.

## ۳. فارسی و سبک

### lint پیشنهادی

- صفر کاراکتر عربی `ي` و `ك` در نثر دانشجو، به‌جز نقل/شناسهٔ اجتناب‌ناپذیر؛
- کنترل فاصلهٔ پیش از/پس از علائم فارسی، ZWNJ و خط شکسته؛
- جلوگیری از سه فاصله، heading خالی، footnote orphan و پرانتز نامتوازن؛
- allowlist برای ارقام لاتین در formula/unit/standard/identifier؛
- واژه‌های ممنوع/ناسازگار از glossary (مثلاً چند ترجمهٔ بی‌دلیل برای یک component)؛
- تشخیص عبارت‌های meta مانند «مقالهٔ اصلی می‌گوید» در متن دانشجو؛
- محدودیت هشداردهنده برای مقدمه/جمع‌بندی تکراری و paragraph بسیار بلند، نه auto-rewrite.

### بازبینی انسانی

- خواندن بلند برای نحو طبیعی و پرهیز از ترجمهٔ تحت‌اللفظی؛
- تمایز فعل/فاعل و مرجع ضمیر؛
- تراکم متناسب با مخاطب دانشگاهی؛
- شوخی علمی حداکثر و فقط در خدمت فهم؛
- یکدستی عنوان، caption، admonition، پرسش و پاسخ‌نامه.

## ۴. اصطلاح و پاورقی

- `glossary.yml` schema-valid و کلیدها یکتا؛
- هر اصطلاح modern/important در نخستین کاربرد معنادار **هر ماژول** footnote انگلیسی داشته باشد؛
- تکرار همان footnote در همان ماژول fail؛
- واژهٔ فارسی canonical در body و مترادف فقط در glossary/توضیح لازم؛
- glossary همهٔ footnote keyها را پوشش دهد؛
- footnote link/backlink در وب keyboard-operable و در PDF شماره/متن درست؛
- English term در footnote با LTR isolation و punctuation صحیح.

## ۵. RTL و متن دو‌جهته

### fixtureهای اجباری

هر output باید این رشته‌ها یا نمونهٔ هم‌ساخت را بدون پرش علامت نمایش دهد:

- `ترتیب احتراق 1-3-4-2 در یک چرخهٔ 720° بررسی می‌شود.`
- `روغن SAE 5W-30 با ردهٔ API SP`؛
- `نسبت i = n_in / n_out = 3.50:1`؛
- `سنسور CKP (Crankshaft Position Sensor)`؛
- `ولتاژ 12 V، مقاومت 2.2 kΩ و فشار 300 kPa`؛
- `کد DTC P0335 / ISO 15031-6`؛
- URL لاتین در جملهٔ فارسی و citation انگلیسی در bibliography؛
- جدول با ستون فارسی، عدد لاتین، علامت `%`، slash، negative sign و پرانتز.

### کنترل DOM/CSS

- `<html lang="fa" dir="rtl">`؛
- `dir=ltr`/`bdi` یا isolation معنایی در spanهای تعریف‌شده؛
- CSS logical (`margin-inline`, `padding-block`, `inset-inline`)؛
- ترتیب DOM با ترتیب خواندن/keyboard برابر؛ تغییر visual order با CSS ممنوع؛
- focus ring و icon previous/next با معنای RTL درست؛
- horizontal overflow صفر در viewportهای اصلی به‌جز container صریح جدول/کد.

### بازبینی بصری

نمونهٔ دشوار در هر viewport screenshot و diff شود. validator یا computed `direction` به‌تنهایی pass نیست. browserهای هدف در نمونه تعیین می‌شوند؛ حداقل Chromium و Firefox، و WebKit در full regression. در corrective Phase 3 screenshotها شاهد sanity فنی‌اند، نه approval انسانی طراحی؛ ممیزی مستقل وب به Codex واگذار شده است.

## ۶. responsive و تعامل وب

viewportهای ثابت:

| Profile | Size CSS px | تمرکز |
|---|---:|---|
| Small mobile | 360 × 800 | navigation، جدول، footnote، zoom |
| Modern mobile | 390 × 844 | line length و media |
| Tablet portrait | 768 × 1024 | TOC/drawer و figures |
| Laptop | 1280 × 800 | persistent TOC و vertical density |
| Desktop | 1440 × 900 | max width و whitespace |

سناریوها: باز/بسته‌کردن TOC، previous/next، anchor عمیق، search فارسی/لاتین، keyboard-only، zoom/dialog، `<details>` پاسخ، back button، print link و حالت JavaScript خاموش برای خواندن اصلی.

## ۷. پاورقی، ارجاع و citation

- هر cross-reference به figure/table/equation/section resolve شود؛
- numbering در HTML/PDF سازگار از همان ID؛
- footnote marker کنار واژهٔ RTL و متن footnote خوانا؛
- برگشت footnote وب focus را به marker درست ببرد؛
- citation key بدون رکورد و bibliography entry بی‌استفاده گزارش شود؛
- لینک بیرونی citation با status و redirect کنترل، اما outage موقت با retry و گزارش از broken permanent جدا شود؛
- هیچ URL خام بلند، خط PDF را خراب نکند.

## ۸. رسانه

- تصویر مکانیکی AI و هندسهٔ قطعهٔ programmatically invented ممنوع است؛
- ابتدا رسانهٔ دقیق موجود از سازنده/دانشگاه/نهاد مهندسی/منبع آموزشی معتبر با
  مجوز روشن جست‌وجو و ثبت می‌شود؛ در نبود آن متن، معادله، جدول، توالی یا جریان
  واقعاً انتزاعی به‌کار می‌رود؛
- هر فایل media دقیقاً یک manifest entry و hash مطابق داشته باشد؛
- license/permission و attribution خالی fail؛
- alt/caption هدف آموزشی و با یکدیگر ناسازگار نباشند؛
- dimension، aspect ratio، orientation و برچسب‌های مکانیکی بازبینی شوند؛
- derivative web و print از master مشخص و بدون upscale بی‌دلیل؛
- تصویر responsive و lazy loading فقط below-fold؛ layout shift کنترل شود؛
- animation/video controls، poster، reduced-motion و fallback PDF؛
- در grayscale، تمایز فقط رنگی نباشد؛
- external critical URL جای local asset را نگیرد؛
- فایل orphan و media بدون استفاده گزارش شود.

## ۹. لینک و navigation

- internal link/anchor صفر broken؛
- previous/next دقیقاً مطابق ترتیب `_quarto.yml`؛
- TOC همان heading hierarchy را نمایش دهد؛
- duplicate ID/slug ممنوع؛
- external link checker با allowlist و retry؛
- URLهای source/research در documentation نیز دوره‌ای کنترل شوند؛
- صفحهٔ 404 فارسی فقط اگر hosting آن را لازم کند؛ local build به server خاص وابسته نباشد.

## ۱۰. دسترس‌پذیری

- Playwright + axe: صفر violation سطح serious/critical؛ موارد moderate با triage ثبت؛
- تنها یک H1، hierarchy بدون jump بی‌دلیل، landmarkهای درست؛
- keyboard کامل، focus visible، no trap، escape برای dialog؛
- نام فارسی معنادار برای controls؛
- contrast متن/رابط و شکل؛
- alt مناسب: decorative خالی، informative هدف‌محور، complex با description نزدیک؛
- table header/scope و caption؛
- prefers-reduced-motion؛
- zoom تا 200٪ بدون از دست‌رفتن محتوا/عملکرد؛
- ARIA snapshot برای navigation، assessment و media dialog.

axe تمام موانع را کشف نمی‌کند؛ keyboard، screen-reader structure و alt accuracy بازبینی انسانی دارند.

## ۱۱. عملکرد

بودجهٔ پیشنهادی برای صفحهٔ معمولی در build production، به‌جز video کاربرخواسته:

- HTML+CSS+JS فشرده ≤ 500 KiB transfer؛
- initial image transfer ≤ 1.5 MiB در viewport موبایل؛
- هیچ JS framework/runtime بزرگ؛
- CLS ≤ 0.1 و LCP هدف ≤ 2.5 s در پروفایل mobile شبیه‌سازی‌شده؛
- همهٔ fontها دارای license، subset و `font-display` مناسب؛
- Lighthouse CI به‌عنوان سیگنال regression، نه جایگزین تست کاربردی.

اگر رسانهٔ آموزشی ضروری بودجه را می‌شکند، علت و lazy/on-demand strategy ثبت می‌شود؛ امتیاز performance باعث حذف محتوای ضروری نمی‌شود.

## ۱۲. چاپ و PDF

### کنترل خودکار

- فرمان PDF exit code صفر و log بدون missing glyph/overfull critical؛
- `qpdf --check` pass؛
- `pdffonts`: فونت‌های لازم embedded؛
- `pdftotext`: عنوان، نمونهٔ فارسی، اصطلاح انگلیسی و پاسخ قابل استخراج؛
- TOC/bookmark و page count در دامنهٔ تصویب‌شده؛
- لینک/annotationهای داخلی و بیرونی معتبر؛
- render تمام صفحات با Poppler بدون failure؛
- شمارش صفحه سفید غیرعمدی، heading orphan heuristic و clipping image/table.

### بازبینی بصری صفحه‌به‌صفحه

- جلد/عنوان، فهرست، شروع هر ماژول، running header/footer و شماره؛
- RTL paragraph و mixed-direction fixtures؛
- footnote split، caption، figure float و cross-reference؛
- heading در انتهای صفحه، سطر یتیم/بیوهٔ آزاردهنده، جدول شکسته؛
- پاسخ‌نامه، glossary و bibliography؛
- A4 در 100٪ و چاپ grayscale؛ حاشیهٔ امن binding؛
- hyperlink visible ولی غیرمزاحم در چاپ.

PDF رسمی از XeLaTeX است؛ print CSS وب فقط fallback و جداگانه smoke-test می‌شود.

## ۱۳. سنجش و پاسخ‌نامه

- هر سؤال به objective و Coverage ID قابل ردیابی باشد؛
- پاسخ از متن قابل استنتاج، اما نه copy-paste جملهٔ قبل؛
- سؤال محاسباتی تمام داده/واحد لازم و convention را دارد؛
- فقط یک تفسیر معقول یا rubric برای پاسخ باز؛
- fault scenario بیش از یک علت ممکن را می‌پذیرد و آزمون discriminating می‌خواهد؛
- پاسخ‌نامه reasoning را نشان دهد، نه فقط گزینه/عدد؛
- reveal وب به‌طور تصادفی پاسخ را در screen-reader/print پنهان نکند؛
- شمارش نوع سؤال با سهم معماری مقایسه شود.

## ۱۴. بازتولیدپذیری build

خط مبنای اثبات‌شده در Phase 3:

- نسخهٔ Node/Quarto/TeX و lockfile ثبت شده است؛
- build از clone تمیز بدون فایل محلی پنهان؛
- fetch شبکه‌ای در build اصلی ممنوع، به‌جز مرحلهٔ research صریح؛
- دو build متوالی از نظر محتوای semantic برابر؛ timestamp/metadata مجاز جدا شود؛
- مسیرهای output ثابت و source tree پس از build dirty نشود؛
- command contract پیاده‌سازی‌شده: `dev`، `build:web`، `build:pdf`، `test`، `test:visual` و `audit:coverage`؛
- اجرای محلی ابتدا lint/coverage، سپس build وب/PDF و سپس آزمون/Artifact را انجام می‌دهد. CI remote در این phase در دامنه نیست؛ همان قرارداد فرمان برای CI آینده آماده است.

## نتیجهٔ امضاشدهٔ L1 اصلاحی در Phase 3

| حوزه | شاهد | نتیجه |
|---|---|---|
| محتوا و پوشش | `artifacts/qa/phase3/content-audit.json` | ۳۴ pass، صفر fail؛ ۱۹۶ ID یکتا و ۲۹ ID مربوط به M08 با anchor واقعی |
| اصطلاح و سنجش | همان گزارش | ۱۸ پاورقی اصطلاح، ۲۰ مدخل واژه‌نامه، ۶ سؤال و ۶ پاسخ تشریحی |
| محاسبه | همان گزارش | مثال‌های گردانندهٔ نهایی، سیاره‌ای، CVT و هیدرولیک باز‌محاسبه شدند |
| رسانه | همان گزارش و `MEDIA_SOURCES.md` | سه رسانهٔ public-domain/CC0، سه manifest entry و checksum منطبق؛ صفر تصویر مبدأ و صفر SVG ردشده |
| وب | `artifacts/qa/phase3/web-audit.json` | ۷۶ pass، صفر fail؛ پنج profile در Chromium و پنج profile در Firefox؛ فقط sanity خودکار |
| دسترس‌پذیری وب | همان گزارش | صفر violation جدی/بحرانی axe؛ keyboard، footnote، alt و JS-off عبور کردند |
| PDF | `artifacts/qa/phase3/pdf-audit.json` | ۲۷ pass، صفر fail؛ ۲۲ صفحه، A4، ۱۶۳ مقصد و ۶ رکورد فونت همگی embedded/subset |
| رندر PDF | شش `pdf-contact-*.png` | تمام ۲۲ صفحه با Poppler رندر، decode و صفحه‌به‌صفحه بازبینی شدند |
| بازتولیدپذیری | clone تمیز + `npm ci` + bootstrap checksum‌شده + `npm test` | ۱۳۷/۱۳۷؛ وب file-for-file یکسان و PDF byte-for-byte یکسان با SHA-256 `98e4e127…` |
| مخزن | `git diff --check` و کنترل syntax | بدون خطای whitespace و بدون دستور ساخت فرضی |

Chromium دقیقاً در عرض‌های ۳۶۰، ۳۹۰، ۷۶۸، ۱۲۸۰ و ۱۴۴۰ پیکسل اجرا شد. Selenium/Firefox در این محیط برای دو درخواست موبایل حداقل viewport داخلی ۴۳۸ پیکسل ایجاد کرد؛ نتیجهٔ Firefox برای RTL، font، image و overflow در عرض واقعی ۴۳۸ ثبت شده و پوشش دقیق ۳۶۰/۳۹۰ را Chromium فراهم می‌کند. WebKit مطابق برنامه به L3 و human audit مستقل وب به Codex موکول است.

## ۱۵. معیار عبور مرحله‌ها

### Gate 1

- ۲۰/۲۰ بازیابی/استخراج؛ matrix بدون source orphan؛ issue/architecture/risks کامیت؛ تصمیم‌های D گزارش؛ توقف. **وضعیت: عبور کرده در ۲۰۲۶-۰۷-۲۱.**

### Gate 2

- ماژول نمونه coverage کامل خود را دارد؛ web/PDF از QMD مشترک ساخته می‌شود؛
  defectهای گزارش‌شده اصلاح و آزمون‌های L1 دوباره pass شده‌اند؛ سابقهٔ baseline
  ردشده ثبت است. **وضعیت: corrective sample آمادهٔ تصمیم دوباره؛ تصویب صریح
  هنوز صادر نشده است.**

### پایان تولید

- تمام IDها Published؛ issue Critical/High باز صفر مگر waiver کاربر؛ manifest کامل؛ آزمون L3 pass؛ PDF در بودجه؛ changelog و build docs کامل.

### آمادهٔ Codex

- `CODEX_AUDIT_BRIEF.md` با command/output/viewport/critical fixture واقعی؛ clone تمیز قابل ساخت؛ known limitation صادقانه؛ هیچ دستور ساخت فرضی.

## نگهداری شواهد

خروجی generated تست در release artifact یا CI نگهداری می‌شود، نه لزوماً در git:

- JSON coverage/links/accessibility/performance؛
- screenshots/diffs؛
- page renders/contact sheet PDF؛
- build logs و نسخه ابزار؛
- issue ledger snapshot و checklist امضاشده.

شکست بصری baseline با به‌روزرسانی خودکار حل نمی‌شود؛ تغییر baseline فقط پس از بازبینی و ذکر علت در commit مجاز است.
