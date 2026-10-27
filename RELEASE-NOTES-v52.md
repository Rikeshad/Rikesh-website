# v52 — Rikesh Adhikari Personal SEO Update

Based on the v51 GitHub Pages–reviewed archive, **not** an independently fetched snapshot of a newer Git commit.

## What changed
- New, unique, concise `<title>` and meta descriptions across all four HTML pages, clearly naming Rikesh Adhikari.
- Added machine-readable `WebSite`, `Person`, and `WebPage` schema markup on the homepage with consistent canonical IDs, professional role, and location.
- Added `og:site_name`, `og:locale`, `og:image`, image description, and Twitter metadata to all pages for consistent previews.
- Made the homepage About copy explicitly identify Rikesh Adhikari in plain, visible text.
- Retained the four canonical URLs, `sitemap.xml`, `robots.txt`, GitHub Pages `CNAME`, `.nojekyll` and `404.html` from v51.
- No layout CSS, animations, mobile navigation, Three.js effects, or existing JavaScript were changed.

## Important limitations
- Top ranking for any search query cannot be guaranteed or purchased through technical SEO alone.
- Cloudflare DNS/redirect rules, server HTTP status for `/.well-known/` URLs, Search Console indexing, and external backlinks cannot be changed by these static files.
- Verify the homepage is `200`, unexpected paths are `404`, and `www` permanently redirects to the non-www domain in the *live* deployment.
- Submit `https://rikeshad.com/sitemap.xml` through Google Search Console and inspect the canonical homepage there.
- Link to this portfolio from authentic public professional profiles, where appropriate.

## Deployment
Copy *the contents* of this folder into your site's checked-out GitHub repository after backing up local changes, then commit and push. Don't add the outer folder as a subdirectory. Inspect the diff before committing so newer edits in your Git repository are not lost.
