# گزارش پژوهش و راستی‌آزمایی

> دامنه: پژوهش حداقلی برای صحت، آموزش و انتشار — تاریخ دسترسی 2026-07-21

## اصول

- پژوهش بیرونی برای تصحیح و توضیح برنامهٔ استاد است، نه بزرگ‌کردن برنامه.
- اولویت با استاندارد، نهاد رسمی، مستند سازنده و مستند رسمی ابزار انتشار است.
- هیچ یافته‌ای به‌تنهایی مجوز بازنشر متن یا تصویر نمی‌دهد.
- یافتهٔ منجر به تغییر محسوس در `ISSUE_LEDGER.md` ثبت و، در ردهٔ D، برای تصویب متوقف می‌شود.

## پژوهش فنی خودرو

| پرسش | منبع معتبر | یافتهٔ قابل‌استفاده | اثر پروژه |
|---|---|---|---|
| آیا حروف API صرفاً مقیاس «بهتر بودن» هستند؟ | [API — Oil Categories](https://www.api.org/products-and-services/engine-oil/eolcs-categories-and-classifications/oil-categories) و [Engine Oil Licensing](https://www.api.org/products-and-services/engine-oil) | دسته‌ها جاری/منسوخ و کاربردمحورند؛ انتخاب باید با نیاز موتور و توصیهٔ سازنده سازگار باشد. | اصلاح ENG-011؛ جدول انتخاب روغن در M05. |
| SAE viscosity grade چه چیزی را طبقه‌بندی می‌کند؟ | [API 1509, Annex F](https://www.api.org/-/media/files/certification/engine-oil-diesel/publications/api%201509-%2021st%20edition%20annex%20f.pdf) | گریدهای SAE طبقه‌بندی رئولوژیک با آزمون‌های دمایی‌اند، نه رتبهٔ کیفیت عمومی. | تفکیک API از SAE در M05. |
| آیا فاصلهٔ ثابت ۶۰هزار کیلومتر برای timing belt قابل تعمیم است؟ | [Ford Scheduled Maintenance](https://www.fordservicecontent.com/Ford_Content/vdirsnet/OwnerManual/Home/Content?ProcUid=G1686026&Uid=G1686022&buildtype=web&countryCode=USA&div=f&languageCode=en&moidRef=G1612532&userMarket=usa&vFilteringEnabled=False&variantid=3324)، [Honda Maintenance Minder](https://owners.honda.com/utility/download?path=%2Fstatic%2Fpdfs%2F2021%2FOdyssey%2F2021_Odyssey_Maintenance_Minder_System.PDF) | برنامه‌های رسمی بسته به موتور، زمان، مسافت و شرایط شدید تفاوت محسوس دارند. | اصلاح ENG-005؛ همیشه رجوع به برنامهٔ OEM. |
| ABS چه چیزی را اندازه می‌گیرد و چگونه فشار را کنترل می‌کند؟ | [NHTSA interpretation — ABS wheel slip](https://www.nhtsa.gov/interpretations/1210corrforweb) | کنترلر از سیگنال‌های سرعت چرخ/لغزش و آستانه‌ها استفاده و فشار را کم، ثابت یا دوباره زیاد می‌کند؛ اندازه‌گیری مستقیم μ ادعای مناسبی نیست. | اصلاح ENG-031؛ نمودار حلقه‌بسته در M09. |
| آیا ABS همیشه مسافت توقف را کوتاه می‌کند؟ | [NHTSA/ASA — Anti-lock Braking System](https://www.mycardoeswhat.org/safety-features/anti-lock-braking-system/) | مزیت اصلی جلوگیری از قفل و کمک به حفظ کنترل است؛ کوتاه‌شدن مسافت در همهٔ سطوح تضمین نمی‌شود. | اصلاح S16/S19؛ سنجش با سؤال موقعیتی. |
| ESC چگونه به مسیر مطلوب کمک می‌کند؟ | [NHTSA — ESC Final Regulatory Impact Analysis](https://www.nhtsa.gov/sites/nhtsa.gov/files/fmvss/ESC_FRIA_%252003_2007.pdf) | ترمز انتخابی چرخ‌ها می‌تواند گشتاور yaw اصلاحی بسازد و خودرو را به سمت مسیر موردنظر راننده هدایت کند. | پل محدود ABS→ESC در M09، بدون توسعهٔ الگوریتم کنترل. |
| کمک‌راننده با خودران چه تفاوتی دارد؟ | [NHTSA — Automated Vehicles for Safety](https://www.nhtsa.gov/vehicle-safety/automated-vehicles-safety) | Level 1 کمک طولی یا جانبی و Level 2 هر دو را فراهم می‌کند، اما راننده باید درگیر بماند؛ قابلیت‌هایی مانند LDW/AEB لزوماً خودران نیستند. | مرزبندی S19 در M10؛ اصلاح ENG-036. |
| آیا نسبت CVT پیوسته است؟ | [Bosch Mobility — Pushbelt](https://www.bosch-mobility.com/en/solutions/transmission-technology/pushbelt/) | pushbelt میان پولی‌های مخروطی، انتقال توان با نسبت پیوسته‌متغیر را ممکن می‌کند. | حل تناقض ENG-028؛ «پله» به شبیه‌سازی کنترل محدود می‌شود. |
| اجزای مبدل گشتاور و lock-up چیست؟ | [ZF Aftermarket — Torque converter / clutches](https://aftermarket.zf.com/en/aftermarket-portal/our-portfolio/passenger-cars/products/clutches/) | پمپ، توربین، استاتور و کلاچ lock-up چارچوب معتبر توضیح‌اند؛ قفل برای کاهش لغزش/بهبود بازده به کار می‌رود. | کنترل طرح M08 و واژگان. |
| قید سرعت دیفرانسیل باز و محدودیت کشش چگونه تفکیک شوند؟ | [Eaton — Open Differential](https://www.eaton.com/us/en-us/products/differentials-traction-control/open-differential.html) و [Limited-Slip Differentials](https://www.eaton.com/br/en-us/products/differentials-traction-control/limited-slip-differentials.html) | دیفرانسیل باز امکان اختلاف دور خروجی‌ها را می‌دهد؛ راه‌حل‌های بایاس گشتاور/لغزش‌محدود مسئله‌ای جدا از قید سینماتیکی‌اند. | بازسازی `#m08-differential` و سؤال ۲. |
| DCT چگونه میان پیش‌انتخاب و گرمای کلاچ سازش می‌کند؟ | [LuK Symposium — Double Clutch: Wet or Dry](https://www.schaeffler.com/remotemedien/media/_shared_media/08_media_library/01_publications/schaeffler_2/symposia_1/downloads_11/09_Double_clutch.pdf) | پیش‌انتخاب مسیر بعدی زمان تعویض را کم می‌کند، اما تحویل گشتاور و آغاز حرکت همچنان به کنترل اصطکاک و حرارت وابسته است. | اصلاح ENG-027 و شکل توالی DCT در M08. |
| معادلهٔ پایهٔ مجموعهٔ سیاره‌ای چه محدودیتی دارد؟ | [University of Michigan / ASME — Single Planetary Gear](https://huei.engin.umich.edu/wp-content/uploads/sites/186/2015/02/DSCC-2012-Zhang.pdf) | سرعت سه عضو با رابطهٔ دندانه‌ها مقید است و تعیین حالت به دو شرط کاری نیاز دارد؛ «همیشه یک عضو ثابت» قاعدهٔ همگانی نیست. | اصلاح ENG-026؛ مثال حل‌شده و سؤال ۳. |
| مرز active و semi-active suspension چیست؟ | [SAE Technical Paper 930266](https://legacy.sae.org/gsdownload/?prodCd=930266)، [SAE — air suspension with semi-active dampers](https://www.sae.org/articles/a-30-year-hiatus-jeep-remakes-wagoneer-sae-ma-06665) | در تعریف پژوهشی، active از عملگر توان‌دار برای نیروی عمودی استفاده می‌کند؛ سامانهٔ فنر بادی می‌تواند با دمپرهای الکترونیکی نیمه‌فعال همراه باشد و خودبه‌خود «فعال کامل» نیست. | تصمیم ENG-035 در Gate 1؛ طبقه‌بندی سه‌گانهٔ M10. |

## پژوهش انتشار و کیفیت

| پرسش | منبع رسمی | یافتهٔ قابل‌استفاده | اثر پروژه |
|---|---|---|---|
| آیا یک منبع می‌تواند کتاب HTML و PDF تولید کند؟ | [Quarto Books](https://quarto.org/docs/books/) | پروژهٔ book فصل‌ها را از منبع مشترک به HTML و PDF و قالب‌های دیگر می‌سازد و ارجاع بین‌فصلی دارد. | مبنای معماری single-source. |
| فصل‌ها و ساختار پروژه چگونه تعریف می‌شوند؟ | [Quarto Book Structure](https://quarto.org/docs/books/book-structure.html) | `_quarto.yml` ترتیب chapters/parts و تنظیمات سطح کتاب را کنترل می‌کند. | ساختار `content/` و manifest مرکزی. |
| شکل، جدول و معادله چگونه قابل ردیابی‌اند؟ | [Quarto Book Cross-references](https://quarto.org/docs/books/book-crossrefs.html) | شناسه و cross-reference بومی برای شکل/جدول/معادله فراهم است. | منع شماره‌گذاری دستی و تست ارجاعات. |
| جهت پایهٔ HTML و محتوای mixed-direction چگونه کنترل می‌شود؟ | [Quarto HTML Options](https://quarto.org/docs/reference/formats/html.html) | گزینهٔ `dir` جهت پایه را تعیین می‌کند و span/divهای native Pandoc امکان override محلی دارند. | `dir: rtl` و wrapperهای LTR برای کد، فرمول، URL و رشته‌های فنی. |
| footnote و citation چگونه تولید شوند؟ | [Quarto Markdown Basics](https://quarto.org/docs/authoring/markdown-basics.html)، [Quarto Citations](https://quarto.org/docs/authoring/citations.html) | syntax استاندارد Markdown/Pandoc برای پاورقی و کتاب‌نامه، قابل اشتراک میان خروجی‌هاست. | سیاست پاورقی ترجمه و BibTeX/CSL. |
| PDF کتاب چگونه تولید شود؟ | [Quarto PDF Basics](https://quarto.org/docs/output-formats/pdf-basics.html)، [PDF Options](https://quarto.org/docs/reference/formats/pdf.html) | PDF از موتورهای TeX قابل تولید است؛ برای bidi، XeLaTeX گزینهٔ مناسب مستندشده است. | XeLaTeX به‌عنوان مسیر پیشنهادی PDF. |
| حروف‌چینی فارسی در TeX چگونه پشتیبانی شود؟ | [CTAN — XePersian](https://ctan.org/pkg/xepersian?lang=en) | XePersian حروف‌چینی فارسی/انگلیسی بر پایهٔ XeTeX/LuaTeX را فراهم می‌کند. | PDF RTL، ارقام/فونت و متن دو‌جهته در نمونه آزموده می‌شود. |
| نسخهٔ فعلی Quarto چیست؟ | [Quarto Download](https://quarto.org/docs/download/) | صفحهٔ رسمی هنگام ممیزی نسخهٔ 1.9 را ارائه می‌کرد. | Quarto 1.9.38 و Pandoc 3.8.3 در نمونه اثبات و برای pin در Gate 2 پیشنهاد شدند. |
| آزمون دیداری چگونه پایدار شود؟ | [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots) | snapshot تصویر و آستانهٔ تفاوت برای regression بصری پشتیبانی می‌شود. | viewportهای RTL و صفحه‌های حساس در Test Plan. |
| دسترس‌پذیری و ساختار ARIA چگونه کنترل شود؟ | [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)، [ARIA Snapshots](https://playwright.dev/docs/aria-snapshots) | ترکیب axe با تست و snapshot ساختار دسترس‌پذیر برای regression ممکن است. | تست عنوان‌ها، landmarkها، alt و تعامل کیبورد. |

## گزینه‌های بررسی‌شده و کنارگذاشته‌شده

| گزینه | دلیل کنارگذاری در این مرحله |
|---|---|
| دو متن مستقل برای وب و PDF | خطر drift و شکست ردیابی منبع؛ مخالف اصل «یک منبع محتوایی». |
| PDF چاپ‌شده از مرورگر به‌عنوان مسیر اصلی | کنترل صفحه‌آرایی رسمی، پاورقی، running header و شکستن جدول در متن فارسی ضعیف‌تر از مسیر اختصاصی XeLaTeX است؛ می‌تواند fallback آزمایشی باشد. |
| Typst به‌عنوان موتور اولیه | گزینه‌ای نویدبخش است، اما اثبات XePersian/XeLaTeX برای فارسی دو‌جهته و پاورقی کتابی در این پروژه ریسک پایین‌تری دارد. در نمونه می‌توان فقط در صورت شکست TeX بازنگری کرد. |
| SPA/React برای کتاب | محتوای عمدتاً خطی و ایستا به پیچیدگی hydration و build app نیاز ندارد؛ HTML ایستا جست‌وجوپذیر و کم‌ریسک‌تر است. |
| فصل‌های تازهٔ EV/Hybrid/CAN/ADAS پیشرفته | خارج از دامنهٔ ۲۰ منبع؛ در `ISSUE_LEDGER.md` به‌عنوان expansion ردشده ثبت شده است. |

## نتیجهٔ راستی‌آزمایی Phase 3

- شش شکل اولویت‌دار M08 به‌صورت SVG اصیل ساخته و بدون بازنشر تصویر مبدأ در `MEDIA_SOURCES.md` ثبت شدند.
- Vazirmatn 33.0.3 با مجوز OFL، فایل‌های محلی وب/PDF و آزمون embedding/subset انتخاب شد.
- معادلات CVT از برابری سرعت مماسی در دو شعاع مؤثر بازاستنتاج شدند؛ قرارداد نسبت، بازده و مرز فرمول نیروی گیره‌ای در متن، شکل، مثال و آزمون تعاملی یکسان است.
- استاندارد پاورقی نخستین کاربرد و واژه‌نامه با ۱۸ پاورقی و ۲۰ مدخل واقعی آزموده شد.
- proof-of-concept مشترک Quarto→HTML/XeLaTeX اجرا شد؛ RTL، bidi، پاورقی، responsive web و PDF رسمی در `PHASE3_AUDIT.md` شواهد pass دارند.

## پژوهش باقی‌مانده پس از Gate 2

- گسترش manifest رسانه فقط هنگام تولید هر ماژول و با همان قاعدهٔ مجوز/اصالت؛
- راستی‌آزمایی فنی issueهای برنامه‌ریزی‌شدهٔ M01–M07 و M09–M10 در batch مربوط، بدون گسترش برنامه؛
- بررسی بسته‌بندی hermetic کامل TeX پیش از release نهایی؛
- آزمون WebKit، performance و regression کامل در L3.
