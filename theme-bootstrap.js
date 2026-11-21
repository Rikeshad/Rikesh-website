(() => {
  try {
    const savedTheme = localStorage.getItem('rikeshTheme');
    document.documentElement.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light';
  } catch {
    document.documentElement.dataset.theme = 'light';
  }
  // Cover only a fresh entry, before first paint. A bounded watchdog always releases it.
  try {
    const returning = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
    const seen = sessionStorage.getItem('rikeshIntroSeen') === '1';
    if (
      !seen &&
      !returning &&
      !location.hash &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      document.documentElement.classList.add('motion-intro-pending');
      window.__rikeshIntroSafety = setTimeout(() => {
        document.dispatchEvent(new Event('rikesh:motion-reset'));
        document.documentElement.classList.remove('motion-intro-pending');
        document.body?.classList.remove(
          'intro-running',
          'intro-revealing',
          'has-intro',
          'no-scroll',
        );
        document.querySelector('#site-intro')?.remove();
        document.querySelectorAll('[data-motion-inert]').forEach((element) => {
          element.inert = element.dataset.motionInert === 'true';
          delete element.dataset.motionInert;
        });
        try {
          sessionStorage.setItem('rikeshIntroSeen', '1');
        } catch {}
      }, 8500);
    }
  } catch {
    // Storage, motion queries or navigation timing must never prevent access.
  }
})();
