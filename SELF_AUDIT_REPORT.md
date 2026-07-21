# گزارش نهایی خودممیزی و اصلاح WorkGPT

## وضعیت

Phase 5 کامل است. WorkGPT محصول ده‌ماژولی را از نظر پوشش، صحت مکانیکی، فارسی، RTL، سنجش، رسانه، وب عملکردی، PDF و بازتولیدپذیری بررسی کرده و defectهای درون اختیار را اصلاح کرده است.

این گزارش **بازرسی مستقل Codex نیست**. Human-style audit وب به Codex واگذار شده و در این مرحله اجرا نشده است.

## دامنهٔ محصول ممیزی‌شده

- ۱۰ ماژول، ۳۰٬۱۳۲ token فاصله‌محور در manuscript؛
- ۲۰ منبع و ۱۹۶ مفهوم منتشرشده؛
- ۵۳ سؤال و ۵۳ پاسخ تشریحی؛
- ۱۳ مثال عددی باز‌محاسبه‌شده؛
- ۱۳۸ پاورقی اصطلاح، ۱۲۴ مدخل glossary و ۳۹ رکورد bibliography؛
- ۱۴ صفحهٔ وب ایستا، 2.98 MiB؛
- PDF ۱۱۱صفحه‌ای A4 با ۸۱۵ مقصد و شش رکورد فونت embedded/subset؛
- سه رسانهٔ فنی دارای حق روشن.

## نتیجهٔ کنترل‌های خودکار

| حوزه | نتیجه | نکتهٔ اصلی |
|---|---:|---|
| محتوا و ردیابی | ۳۶/۳۶ | ۲۰/۲۰، ۱۹۶/۱۹۶، anchor واقعی، ۵۳/۵۳ پاسخ، ۱۳/۱۳ محاسبه |
| وب | ۵۶/۵۶ | ۱۴ صفحه، ۸۲۲ لینک داخلی، پنج viewport Chromium، دو Firefox، صفر serious/critical axe |
| PDF | ۵۳/۵۳ | ۱۱۱ صفحه، qpdf، فونت، متن، ۱۳۸ footnote، رندر و decode تمام صفحه‌ها |
| **مجموع** | **۱۴۵/۱۴۵** | صفر fail در artifactهای Phase 5 |

گزارش‌های machine-readable در `artifacts/qa/phase5/` قرار دارند. `web-audit.json` عمداً `human_aesthetic_approval: false` ثبت می‌کند.

## defectهای یافته و اصلاح‌شده در Phase 5

| defect | شاهد شکست | اصلاح | بازآزمون |
|---|---|---|---|
| overflow جدول‌ها در موبایل | ماتریس نخست وب در ۳۶۰/۳۹۰px | wrapper اسکرول، logical width و جلوگیری از overflow document | ۵۶/۵۶ وب |
| جدول‌های bare و hierarchy ضعیف | بازبینی shared style | padding، border، zebra، caption و فاصلهٔ heading/table | Chromium و PDF نهایی |
| front matter ناقص glossary تولیدشده | content/web preflight | generator بدون خط خالی میان delimiter و metadata | check همگامی + build هر دو خروجی |
| پیکان‌های mixed-direction و missing glyph | log ساخت‌های میانی | island صریح `.ltr` برای پیکان‌ها و رشته‌های فنی | صفر missing glyph در سه pass |
| تراکم چاپ و حجم ۸۶صفحه‌ای | build کامل نخست | 12pt، leading 1.15 و حاشیهٔ رسمی 31/31/30/26mm | PDF نهایی ۱۱۱ صفحه در دامنهٔ ۱۰۸–۱۳۵ |
| قطع‌شدن فایل کمکی XeLaTeX در workspace | aux ناقص و شکست pass دوم | اجرای همان XeLaTeX در workdir موقت از wrapper شفاف | سه pass کامل و build پایدار |
| overfull مدخل glossary | 1.75pt در هر pass | کوتاه‌کردن label انگلیسی به `counterweight` و حفظ تعریف فارسی | صفر overfull |
| قطع سه PNG شاهد | decode پس از نوشتن مستقیم workspace | montage موقت هشت‌بیتی، سپس copy و decode | ۲۸/۲۸ contact sheet |

همهٔ defectها در `ISSUE_LEDGER.md` ثبت شده‌اند؛ شکست‌های میانی از سابقه حذف نشده‌اند.

## صحت مکانیکی و محاسبات

- ENG-001 تا ENG-036 به مقصد واقعی درس وصل و در Phase 5 `Verified` شدند.
- جهت قطار دنده، فاصلهٔ رخداد توان، CVT، دیفرانسیل، مجموعهٔ سیاره‌ای، DCT، ABS، آکرمن و طبقه‌بندی تعلیق با قراردادهای مصوب سازگارند.
- متن رفتار ایده‌آل را از افت، گرما، لغزش، محدودیت کشش، کالیبراسیون و تنوع طراحی واقعی جدا می‌کند.
- ۱۳ مجموعهٔ محاسبه برای حجم/تراکم، توان/گشتاور، سرعت پیستون، هیدرولیک، گرما، نسبت دنده، final drive، سیاره‌ای، CVT، ترمز، انرژی و فنر دوباره محاسبه شدند.
- ۵۳ پاسخ از مادهٔ تدریس‌شده قابل استنتاج‌اند و پاسخ‌های تشخیصی یک نشانه را حکم قطعی قطعه نمی‌کنند.

## فارسی و RTL

- صفر نویسهٔ ی/ک عربی در student QMD؛
- صفر ID داخلی، عبارت workflow، citation ناقص `n.d.` یا URL خام در PDF؛
- ۱۳۸ footnote در نخستین کاربرد هر ماژول، بدون orphan؛
- پیکان، نسبت، واحد، abbreviation و فرمول با island یا محیط LTR؛
- واژه‌نامه و منابع از نظر تراکم، line wrap و bidi در PDF دیده شدند؛
- prose، heading، caption، سؤال و پاسخ در جریان تولید خوانده و اصطلاحات مشترک یکسان شدند.

## بازبینی PDF

تفکیک شواهد رعایت شده است:

1. **عبور ساختاری خودکار:** ۵۳/۵۳، qpdf، pdfinfo، pdffonts، pdftotext، destinations، blank-page scan، XeLaTeX log و Poppler.
2. **عبور خوانایی دستی WorkGPT:** هر ۱۱۱ صفحهٔ همان PDF نهایی در ۲۸ contact sheet مشاهده شد؛ title، TOC، شروع فصل‌ها، header/footer، جدول‌ها، معادلات، figures، footnoteها، پاسخ‌نامه، glossary و references بدون clipping یا overlap بودند.

نتیجهٔ TeX: سه pass، صفر missing glyph، صفر overfull، صفر unresolved reference و ۱۵ underfull غیرمسدودکننده در pass نهایی. PDF ۱۱۱ صفحه و در دامنهٔ مصوب است.

## وب

WorkGPT این موارد را آزمود: build محلی، ۱۴ صفحه، ۸۲۲ لینک، asset/console، RTL/font، overflow، alt، heading، ۱۳۸ footnote/backlink، keyboard، CVT calculator، JavaScript-off، print fallback، answer key، glossary، search و citation.

Chromium در ۳۶۰×۸۰۰، ۳۹۰×۸۴۴، ۷۶۸×۱۰۲۴، ۱۲۸۰×۸۰۰ و ۱۴۴۰×۹۰۰ اجرا شد. Firefox درخواست ۳۹۰×۸۴۴ و ۱۴۴۰×۹۰۰ را دریافت کرد، با client width واقعی ۴۳۸ و ۱۴۲۸. WebKit و approval زیبایی‌شناختی انسانی وب به Codex واگذار شده‌اند.

## رسانه و حق

- دقیقاً سه رسانهٔ public-domain/CC0، هر کدام با استفاده، caption، alt، manifest و hash؛
- صفر تصویر مقالهٔ مبدأ، صفر تصویر مکانیکی AI و صفر SVG ردشده؛
- figureها در هر دو خروجی بارگذاری و در PDF مشاهده شدند؛
- نبود رسانهٔ کافی با متن/معادله/جدول/توالی حل شد، نه placeholder.

## نتیجه و handoff

وظیفهٔ تولید و خودممیزی WorkGPT کامل است. محدودیت‌ها در `UNRESOLVED_ISSUES.md` و قرارداد مرحلهٔ بعد در `CODEX_AUDIT_BRIEF.md` ثبت‌اند. repository آمادهٔ بازرسی مستقل است، اما هنوز independently audited یا approved by Codex نیست.
