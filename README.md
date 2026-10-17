# Rikesh Adhikari Portfolio — v21

This version brings the recent fixes together into one clean build.

## Main changes

- Reference-matched Three.js/WebGL spiral galaxy background.
- Desktop galaxy uses up to 181,000 particles with seven spiral branches.
- The galaxy remains one coherent 3D object and rotates slowly behind the site.
- Scroll changes the camera position gently; pointer movement adds only subtle depth.
- The galaxy canvas is fixed, decorative and uses `pointer-events: none` so it cannot block the website.
- Fireworks button remains directly below the portrait. There are no rocket controls or background rockets.
- Main navigation shows each visitor's local time.
- The Darwin page independently shows the current Darwin time using `Australia/Darwin`.
- Contact form uses `mailto:` so the visitor's configured email handler can open with the message pre-filled for `arikesh873@gmail.com`.
- Contact feedback now says the email app *should* open rather than claiming the message was sent.
- Calculator keyboard shortcuts ignore form fields and the calculator no longer uses `eval`/`Function` to calculate expressions.
- Custom timer input works with the Set button and Enter key, validates 1–180 minutes and remains persistent across refreshes.
- Mobile navigation remains clickable from the same 1100px breakpoint at which desktop navigation is hidden.
- Project galleries use stronger 3D depth, sharp side cards, gentle pointer tilt and a larger fullscreen viewer.
- Original full-resolution PNG screenshots are used directly. The source images were not recompressed or downscaled.
- Project screenshot blur filters are disabled.
- Project galleries auto-rotate, pause on interaction, support drag/swipe, arrows and dots, and open the centre image in a high-quality modal.
- Human-facing copy was revised to sound more natural and straightforward.

## Publish

```powershell
git add .
git commit -m "Refine 3D galaxy project galleries and contact flow"
git push origin main
```


## v22 immersive galaxy framing
- Reframed the Three.js camera inside the 14-unit spiral radius so the galaxy fills the entire viewport like the supplied reference.
- Increased desktop/mobile camera FOV to 70/72 degrees and reduced camera distance.
- Removed the galaxy offset, reduced fog, and lightened the foreground veil so the outer spiral arms remain visible across the screen.
- Reference parameters remain 181000 particles, size 0.031, radius 14, 7 branches, spin 2.823, randomness 2, randomnessPower 8.495, #ff6e38 to #791b1b.

## v24 — Manual Day / Night Mode

- Added a manual Day / Night theme control on the main navigation, mobile menu and all subpages.
- The visitor's preference is stored in `localStorage` under `rikeshTheme`, so it stays selected across refreshes and project/Darwin pages.
- Night mode remains the original default.
- Day mode uses a warm light palette, light glass cards, dark text and a softer version of the live 3D galaxy rather than removing the galaxy entirely.
- Project heroes remain cinematic/dark in both modes to preserve contrast over video imagery.
- Theme controls update their icon, label, tooltip and accessible label based on the current mode.


## v25 contact form update
- Desktop/laptop visitors open a pre-filled Gmail compose page in a new tab.
- Mobile/tablet visitors keep the native `mailto:` flow so their configured email app opens.
- Recipient remains `arikesh873@gmail.com`; the visitor's name, email, subject and message are pre-filled.

## v26 — Full-screen fireworks celebration
- Reworked the portrait fireworks button into a large multi-wave celebration.
- Visible launch shells rise before bursting.
- 9 bursts on compact/mobile layouts and 20 scheduled bursts on desktop, followed by a large finale.
- Bursts are distributed across the full viewport with sphere, ring, and palm-style patterns.
- Added bright explosion flashes, launch trails, gravity, drag, longer spark life, and a five-burst desktop finale.
- No “Happy New Year” text or celebration message is rendered; the effect remains simply Launch Fireworks.
- The button temporarily disables while the show is active to avoid stacking multiple expensive particle shows.

## v27 — Day mode refinement
- Warm ivory day palette retained, with stronger charcoal text and antique-gold accents.
- Fixed washed-out hero `LIMITS.` styling in day mode.
- Improved contrast on mini cards, skill cards, technology marquee and secondary labels.
- Reworked Darwin commitment/personal cards so headings and body copy remain readable.
- Improved day-mode glass panels, form fields, secondary buttons, navigation and toast contrast.
- Reduced daytime galaxy opacity while retaining visible warm space detail.
- Added print animation suppression so exported/printed pages do not capture moving letter trails.
