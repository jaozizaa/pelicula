// Troca automática das fotos do hero com fade (CSS faz a transição de opacidade)
(function () {
  var INTERVALO = 5000; // ms entre trocas — ajuste aqui
  var slides = document.querySelectorAll('.hero__slide');
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var atual = 0;
  var timer = null;

  function mostrar(i) {
    slides[atual].classList.remove('is-active');
    slides[atual].setAttribute('aria-hidden', 'true');
    atual = i;
    slides[atual].classList.add('is-active');
    slides[atual].removeAttribute('aria-hidden');
  }

  function proximo() { mostrar((atual + 1) % slides.length); }
  function iniciar() { if (!timer) timer = setInterval(proximo, INTERVALO); }
  function parar() { clearInterval(timer); timer = null; }

  // Pausa quando a aba não está visível
  document.addEventListener('visibilitychange', function () {
    document.hidden ? parar() : iniciar();
  });

  iniciar();
})();
