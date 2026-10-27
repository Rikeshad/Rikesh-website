# Rikesh Adhikari Portfolio — v52 Personal SEO

This is a complete **GitHub Pages static-site build** based on the earlier v51 reviewed archive. It adds personal-identity search metadata without replacing the visual design. Read `RELEASE-NOTES-v52.md` for the precise changes.

## Install
1. Back up your current GitHub working directory. Your online site might contain changes made since the v51 package.
2. Extract this ZIP. Copy the files **inside** `rikesh-portfolio-waves-v52-personal-seo` into the root of your existing checked-out `rikeshad.com` repository. Keep the existing `.git` directory.
3. Review changed files in VS Code Source Control. Newer local edits must be reconciled before replacement.
4. From Windows PowerShell in your repository folder, run: `git add .; if ($LASTEXITCODE -eq 0) { git commit -m "Improve Rikesh Adhikari personal SEO v52"; if ($LASTEXITCODE -eq 0) { git push origin main } }`
5. After GitHub Pages deployment, submit `https://rikeshad.com/sitemap.xml` in Google Search Console and inspect the homepage.

## What this cannot do
No static files can guarantee position #1 in Google. Inspect Cloudflare redirects and the unexpected `/.well-known/` paths separately; verify they return real HTTP 404 responses. This archive cannot change Cloudflare settings or Google indexing directly.
