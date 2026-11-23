// Troca automática das fotos do hero com fade (CSS faz a transição de opacidade)
(function () {
  var INTERVALO = 5000; // ms entre trocas — ajuste aqui
  var slides = document.querySelectorAll('.hero__slide');
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var atual = 0;
  var pausadoPeloUsuario = false;
  var timer = null;

  function mostrar(i) {
    var anterior = slides[atual];
    slides.forEach(function (sl) { sl.classList.remove('is-saindo'); });
    anterior.classList.remove('is-active');
    anterior.classList.add('is-saindo');          // continua visível por baixo
    anterior.setAttribute('aria-hidden', 'true');
    atual = i;
    slides[atual].classList.add('is-active');     // a nova aparece por cima
    slides[atual].removeAttribute('aria-hidden');
    setTimeout(function () { anterior.classList.remove('is-saindo'); }, 1500);
  }

  function proximo() { mostrar((atual + 1) % slides.length); }
  function iniciar() { if (!timer) timer = setInterval(proximo, INTERVALO); }
  function parar() { clearInterval(timer); timer = null; }

  // Pausa quando a aba não está visível
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) parar(); else if (!pausadoPeloUsuario && !document.documentElement.classList.contains('com-intro')) iniciar();
  });

  // Botão de pausa (pedido de acessibilidade: nada se mexe por mais de 5 s sem poder parar)
  var botao = document.querySelector('.hero__pausa');
  if (botao) {
    botao.addEventListener('click', function () {
      pausadoPeloUsuario = !pausadoPeloUsuario;
      pausadoPeloUsuario ? parar() : iniciar();
      botao.setAttribute('aria-pressed', String(pausadoPeloUsuario));
      botao.setAttribute('aria-label', pausadoPeloUsuario ? 'Retomar fotos' : 'Pausar fotos');
    });
  }

  // Com a abertura rodando, o slideshow só começa quando a foto aparece
  if (document.documentElement.classList.contains('com-intro')) {
    document.addEventListener('intro-fim', function () { if (!pausadoPeloUsuario) iniciar(); }, { once: true });
  } else {
    iniciar();
  }
})();
