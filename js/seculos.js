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
    // Cobre do topo da lateral até logo abaixo da lista, na largura toda: assim nenhum pedaço
    // do título (letras de 85 px saem da caixa do texto) aparece antes da hora
    var base = lateral.getBoundingClientRect();
    var l = lista.getBoundingClientRect();
    cortina.style.top = '0px';
    cortina.style.left = '0px';
    cortina.style.width = base.width + 'px';
    cortina.style.height = (l.bottom - base.top + 16) + 'px';
    // Só a cortina se move: o texto fica parado e nítido (animar o texto o deixava borrado
    // até o fim da animação). Ease-in-out com arranque curto (.4,0,.2,1): começa logo,
    // desacelera devagar no fim. 1,6 s.
    if (animacao) animacao.forEach(function (an) { an.cancel(); });
    animacao = [
      cortina.animate(
        [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
        { duration: 1600, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' }
      )
    ];
    var opcoesTexto = { duration: 1100, delay: 120, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' };
    animacao = [
      cortina.animate(
        [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
        { duration: 1200, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' }
      ),
      titulo.animate(entrada, opcoesTexto),
      lista.animate(entrada, opcoesTexto)
    ];
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
