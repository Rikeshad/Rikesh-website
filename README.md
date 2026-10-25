# Rikesh Adhikari — Complete Portfolio Website (Wave Story Fixed)

This is the full working portfolio website from your existing wave/rings version, with all pages, scripts, media, assets, and the heading-layout correction.

## Run locally
Open this folder in VS Code, select `index.html` and run **Live Server**, or run `python -m http.server 5500` from this folder and open `http://localhost:5500`.

## Deploy
Upload the contents of this folder to Cloudflare Pages (or use it as your Pages deployment directory).

## What changed
- `exact-waves.css`: corrected the actual `.wave-story .story-copy` selectors, including desktop and mobile layout. Text now sits inside the left content area, below the fixed navigation, clear of the wave animation and bottom controls.
- `styles.css`: contains the complete stylesheet you most recently supplied.
- Every other existing site page, asset, and JavaScript file is retained.

**Note:** Concentric-ring graphics use Three.js loaded from an external CDN, as in your original website. Internet access is required for that third-party library to load.
