document.addEventListener('DOMContentLoaded', () => {
  const includes = document.querySelectorAll('[data-include]');
  includes.forEach(async (el) => {
    const url = el.getAttribute('data-include');
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Failed to load include:', url, res.status);
        return;
      }
      const text = await res.text();
      el.innerHTML = text;
    } catch (e) {
      console.error('Error loading include:', url, e);
    }
  });
});
