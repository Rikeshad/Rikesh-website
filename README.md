# Rikesh Portfolio v48 — Mobile Layout Fix

Extract this archive, then upload **the files inside `rikesh-portfolio-waves-v48`** into your existing website's root folder. Replace older copies, keeping the same structure.

## Fixes in v48
- Mobile homepage hero `CREATE / WITHOUT / LIMITS.` scales down while keeping the staggered three-line appearance. Removed excessive small-screen line indentation and clipping.
- Mobile contact heading now scales and wraps without forcing the contact grid wider than the viewport.
- Contact/email card, Copy button, input fields, textarea and Send button all fit on narrow phones.
- Added min-width constraints and a single-column grid for screens 760px and narrower; prevents long text from stretching other content.
- Changed `responsive-cinematic.css` links to `?v=48` in all four pages so a cached older CSS file is less likely to linger after deployment.
- Welcome-only intro (v47), mobile menu and theme toggle (v46), and homepage cinematic line reveals (v46) are unchanged.

### Verification
Layout measured in a local headless Chromium rendering at viewport widths 320, 360, 390, 430, 600, 760, 768, 1024 and 1440px. External web fonts, Three.js effects and hosting services were not part of those offline checks.

### Git (Windows PowerShell)
From your site's local Git repository folder, after extracting and replacing files:

`git add .; if ($LASTEXITCODE -eq 0) { git commit -m "Fix mobile website layout v48"; if ($LASTEXITCODE -eq 0) { git push origin main } }`

### v50 — First-title animation fix

The first scroll heading remains hidden until the welcome screen finishes and the cinematic line reveal begins, so the title does not flash fully formed before animating.
