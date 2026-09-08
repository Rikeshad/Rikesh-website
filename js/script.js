const percentage = document.getElementById('percentage');
const loaderProgress = document.getElementById('loaderProgress');
const intro = document.getElementById('intro');
const website = document.getElementById('website');

let progress = 0;

const loader = setInterval(() => {
  const increase = Math.floor(Math.random() * 5) + 1;
  progress += increase;

  if (progress >= 100) {
    progress = 100;
    clearInterval(loader);
  }

  percentage.textContent = progress + '%';
  loaderProgress.style.width = progress + '%';
}, 70);

setTimeout(() => {
  intro.classList.add('exit');
  website.classList.add('show');
  document.body.classList.remove('loading');
}, 4200);

setTimeout(() => {
  intro.remove();
}, 5600);

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (event) {
    const targetId = this.getAttribute('href');

    if (targetId === '#') return;

    const target = document.querySelector(targetId);

    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
