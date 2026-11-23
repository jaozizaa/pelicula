// Botões SÉC. XX / SÉC. XXI: o clicado fica preenchido em azul, o outro só com contorno,
// e o título da lateral acompanha. Por enquanto os dois séculos mostram os mesmos 6 cinemas.
(function () {
  var secao = document.getElementById('mapa');
  if (!secao) return;
  var titulo = document.getElementById('mapa-titulo');
  var botoes = secao.querySelectorAll('.botao-seculo');

  var ROTULOS = { xx: 'Séc. XX', xxi: 'Séc. XXI' };

  var lateral = secao.querySelector('.mapa__lateral');
  var lista = secao.querySelector('.mapa__lista');
  var cortina = null;
  var animacao = null;

  // Título e lista surgem juntos da esquerda para a direita: uma cortina da cor da lateral
  // cobre o texto e encolhe para a direita (Web Animations: igual em Chrome, Firefox/Zen e Safari)
  function revelarTexto() {
    if (!lateral || !titulo || !lista || !lateral.animate) return;
    if (!cortina) {
      cortina = document.createElement('div');
      cortina.className = 'mapa__cortina';
      cortina.setAttribute('aria-hidden', 'true');
      lateral.appendChild(cortina);
    }
    var base = lateral.getBoundingClientRect();
    var t = titulo.getBoundingClientRect();
    var l = lista.getBoundingClientRect();
    var folga = 12;
    var topo = Math.min(t.top, l.top) - base.top - folga * 2;     // inclui o acento do É
    var baixo = Math.max(t.bottom, l.bottom) - base.top + folga;
    var esquerda = Math.min(t.left, l.left) - base.left - 40;    // inclui os números da lista
    var direita = Math.max(t.right, l.right) - base.left + folga;
    cortina.style.top = topo + 'px';
    cortina.style.height = (baixo - topo) + 'px';
    cortina.style.left = Math.max(0, esquerda) + 'px';
    cortina.style.width = (direita - Math.max(0, esquerda)) + 'px';
    if (animacao) animacao.cancel();
    animacao = cortina.animate(
      [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
      { duration: 800, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' }
    );
  }

  function definir(seculo) {
    if (secao.getAttribute('data-seculo') === seculo) return;
    secao.setAttribute('data-seculo', seculo);
    revelarTexto();
    if (titulo) titulo.textContent = ROTULOS[seculo];
    botoes.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-seculo') === seculo));
    });
    window.SECULO_ATUAL = seculo;
    document.dispatchEvent(new CustomEvent('seculo', { detail: seculo }));
  }

  botoes.forEach(function (b) {
    b.addEventListener('click', function () { definir(b.getAttribute('data-seculo')); });
  });

  window.SECULO_ATUAL = secao.getAttribute('data-seculo') || 'xxi';
})();
