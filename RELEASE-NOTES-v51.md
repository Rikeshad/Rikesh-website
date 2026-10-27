# v51 — GitHub Pages code + indexing review (27 October 2026)

This is a **new build**, not a renamed v50 ZIP. The files were rebuilt from the available v50 site package, checked against the published GitHub `main` homepage and responsive stylesheet, and edited for GitHub Pages. Since direct repository download was unavailable, do compare with any newer unpublished local changes before overwriting your local folder.

## Changes from v50
- Added GitHub Pages root `CNAME` for `rikeshad.com` and empty `.nojekyll`.
- Added `robots.txt`, a sitemap listing the four intended indexable URLs, and a noindex-branded 404 page.
- Added distinct canonical URLs, indexing directives, page descriptions and Open Graph metadata on all four pages.
- Corrected malformed closing `</link>` tags in homepage and Darwin HTML.
- Converted key navigation links to root-relative URLs to avoid accidentally nested URLs.
- Updated stylesheet cache versions to v51.
- Made welcome-screen session-storage access failure-safe; visitors with blocked storage can still reach the homepage.
- Added targeted mobile project-page grid/heading overflow fixes and reduced-motion handling.
- Made the open hamburger menu opaque so oversized animated background headings cannot visually interfere with links.
- Made the homepage timer work when localStorage is unavailable.
- Aligned intro/header visibility for all three subpages as well as the homepage.
- Fixed unreadable light-theme project-hero text over the dark video/background.
- Clarified contact form behaviour: it opens an email draft and does not automatically send.
- Removed inactive `_headers` / `_redirects` (Cloudflare Pages-only controls, not applied by GitHub Pages) and misleading prior-build notes.
- Preserved existing portfolio visuals, content, projects, welcome animation, menu, and waves.

## Out of scope — cannot fix by editing website ZIP alone
- `www` -> apex redirect and DNS; check GitHub Pages custom domain + Cloudflare DNS records.
- Google Search Console crawl status; submit `/sitemap.xml` after deployment and wait for recrawl.
- Third-party Darwin image availability and the working status of `brewbean.rikeshad.com`.
- Contact form opens Gmail / mail client; it is **not** a server-based email delivery system.

## Deployment
1. Back up your current repository and any local changes.
2. Extract this ZIP. Copy the **contents** of this directory to the **root of the existing GitHub repo**, replacing matching files. Ensure `.nojekyll` and `CNAME` are included (Windows may hide dotfiles).
3. From VS Code Windows PowerShell, run:
   `git add .; if ($LASTEXITCODE -eq 0) { git commit -m "Review website code and fix GitHub Pages indexing"; if ($LASTEXITCODE -eq 0) { git push origin main } }`
4. Check GitHub Pages deployment, `https://rikeshad.com/sitemap.xml`, `https://rikeshad.com/robots.txt`, the four pages, and `https://rikeshad.com/.well-known/darwin/darwin/` (should be 404).
5. In Search Console, submit `sitemap.xml` and inspect legitimate URLs.
