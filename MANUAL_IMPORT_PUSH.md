# راهنمای واردکردن تاریخچه و push دستی

اتصال GitHub در این پروژه فقط‌خواندنی است. این راهنما برای مالک مخزن است؛ WorkGPT هیچ‌یک از فرمان‌های push زیر را اجرا نکرده است.

## ۱. صحت فایل‌های تحویل

در پوشهٔ artifactها ابتدا checksumهای manifest را بررسی کنید:

```bash
sha256sum -c AutoMechanic-phase6-SHA256SUMS.txt
```

سپس ZIP، bundle و PDF را جداگانه بررسی کنید:

```bash
unzip -t AutoMechanic-phase6.zip
git bundle verify AutoMechanic-phase6.bundle
qpdf --check AutoMechanic-General-Automotive-Mechanics-fa.pdf
```

## ۲. روش پیشنهادی: واردکردن bundle در clone تازه

```bash
git clone AutoMechanic-phase6.bundle AutoMechanic-phase6
cd AutoMechanic-phase6
git branch -a
git switch workgpt/full-production
git log --oneline --decorate --graph 489676f..HEAD
git status --short
```

`git status --short` باید خالی باشد. commit پایهٔ اصلاحی Phase 3 باید ancestor شاخه باشد:

```bash
git merge-base --is-ancestor 489676f9c9cff998204eb0904f28905057ed6571 HEAD
```

## ۳. واردکردن bundle در clone موجود

از شاخهٔ کاری تغییرنشده یا clone پشتیبان استفاده کنید:

```bash
git fetch /path/to/AutoMechanic-phase6.bundle \
  refs/heads/workgpt/full-production:refs/remotes/phase6/workgpt/full-production
git log --oneline --decorate --graph \
  489676f9c9cff998204eb0904f28905057ed6571..refs/remotes/phase6/workgpt/full-production
git switch -c workgpt/full-production \
  refs/remotes/phase6/workgpt/full-production
```

اگر شاخهٔ هم‌نام از قبل وجود دارد، آن را بی‌اجازه overwrite یا force-update نکنید؛ ابتدا SHAها را مقایسه و نام موقت انتخاب کنید.

## ۴. بازسازی پیش از انتشار

```bash
npm ci
npm run bootstrap:tools
npm run setup:browsers
npm test
```

نتیجهٔ مرجع WorkGPT: ۳۶/۳۶ محتوا، ۵۶/۵۶ وب و ۵۳/۵۳ PDF. خروجی‌های اصلی:

- `_output/web/`
- `_output/pdf/auto-mechanic-fa.pdf`

## ۵. اتصال remote و push مالک

پس از بازبینی کامل:

```bash
git remote -v
git remote set-url origin git@github.com:Danyal0096/AutoMechanic.git
git push -u origin workgpt/full-production
```

force-push، merge به `main` و tag/release در این تحویل خودکار نشده‌اند. انتخاب merge یا PR و زمان انتشار نهایی با مالک است.

## ۶. نقش سایر artifactها

- ZIP: snapshot کامل فایل‌ها و خروجی‌ها؛ تاریخچهٔ Git نیست.
- Patch: diff باینری‌پذیر از commit `489676f` تا HEAD؛ برای مرور یا اعمال روی همان baseline.
- Bundle: روش authoritative برای حفظ branch و commit history.
- Web ZIP و PDF: artifactهای آمادهٔ مشاهده؛ جای source/history را نمی‌گیرند.
- Manifest و SHA256SUMS: branch، SHA، فایل‌ها، فرمان‌ها، نتیجه‌ها و صحت دانلود.

پس از import، audit مستقل Codex را روی شاخه‌ای جدا طبق `CODEX_AUDIT_BRIEF.md` اجرا کنید. وجود این brief به معنی اجرای audit نیست.
