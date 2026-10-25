(() => {
  try {
    const savedTheme = localStorage.getItem('rikeshTheme');
    document.documentElement.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light';
  } catch {
    document.documentElement.dataset.theme = 'light';
  }
})();
