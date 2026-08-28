const nav = document.querySelector('.nav');
const progress = document.getElementById('progress');
const themeToggle = document.getElementById('themeToggle');
const menuButton = document.getElementById('menuButton');
const desktopNav = document.querySelector('.desktop-nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max ? (window.scrollY / max) * 100 : 0}%`;
});

const savedTheme = localStorage.getItem('jergan-theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
function updateThemeIcon() {
  themeToggle.textContent = document.documentElement.dataset.theme === 'light' ? '☾' : '☼';
}
updateThemeIcon();
themeToggle.addEventListener('click', () => {
  const light = document.documentElement.dataset.theme === 'light';
  document.documentElement.dataset.theme = light ? 'dark' : 'light';
  localStorage.setItem('jergan-theme', light ? 'dark' : 'light');
  updateThemeIcon();
});

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  desktopNav.classList.toggle('mobile-open', !open);
});
desktopNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  desktopNav.classList.remove('mobile-open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
