# Rikesh Portfolio Dark v8

Updated for improved readability and hero composition.

- Easier-to-read Plus Jakarta Sans display typography across the site
- Smaller, fully visible CREATE / WITHOUT / LIMITS hero treatment
- Gentler wave animation that does not distort letters
- Portrait shifted right and reduced slightly to avoid headline overlap
- More legible navigation, labels, technical metadata and section headings
- All previous v7 functionality preserved

# Rikesh Portfolio — Dark Interactive Edition

Deploy the entire folder to Cloudflare Pages. Use no framework/build command. The project routes are folder-based so they appear as clean URLs without `.html`.

## Behaviour
- The cinematic **WELCOME TO MY WEBSITE** intro uses `sessionStorage`, so it runs only once per browser tab/session. Refreshing, opening projects, Darwin, or returning home in the same tab will not replay it.
- The homepage timer uses `localStorage`, so it survives refreshes and reopening the site.
- Browser notifications for the one-minute timer warning require visitor permission and work best over HTTPS.
- Contact form opens the visitor's configured email application with a prefilled message to `arikesh873@gmail.com`.
- Darwin images are remote web-hosted images and are not bundled into this folder.


## v10 updates
- Fixed the invisible `LIMITS.` gradient when the wave animation splits each word into letter spans.
- Added a professional personal statement showing Rikesh's long-term connection to Darwin on the homepage and Darwin guide.
- Added `HOME, BY CHOICE` to the Darwin portrait badge.
