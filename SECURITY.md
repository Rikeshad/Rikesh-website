# Security and performance review

This build is a static front-end portfolio. It does not contain a server-side database, authentication system or application API.

## Applied hardening

- Added a Cloudflare Pages `_headers` policy with CSP, anti-framing, MIME sniffing protection, referrer controls, permissions restrictions and HSTS.
- Added Subresource Integrity to the Three.js CDN dependency.
- Removed the second Three.js CDN dependency so the site uses one pinned build.
- Removed inline scripts and inline event handlers. HTML contains no inline style attributes; `style-src-attr 'unsafe-inline'` is retained because the animation engine updates element styles and CSS variables at runtime.
- Replaced the dynamic word renderer with DOM node creation instead of `innerHTML`.
- Confirmed there is no `eval()`, `new Function()`, `document.write()` or user-input HTML injection in the project scripts.
- Contact form values are encoded with `encodeURIComponent()` before being placed into mail URLs.
- External links that open a new tab use `rel="noopener"`.
- No API keys, passwords, private keys or database credentials were found in the public source tree.

## Performance changes

- Three.js scripts are deferred and load in document order.
- Exact-wave, galaxy and cursor animation loops pause when the tab is hidden.
- Foreground fireworks stop rendering while the tab is hidden and are cleaned up on page exit.
- WebGL pixel ratios and geometry/particle density remain reduced on mobile devices.
- The secondary POS demonstration video lazy-loads near the viewport and pauses when off-screen.
- Project screenshots use lazy loading except the first visible image.
- Static assets receive a seven-day browser cache policy through Cloudflare Pages.

## Hosting note

The `_headers` file is intended for Cloudflare Pages. If this site is moved to another host, reproduce the same response headers in that host's configuration.
