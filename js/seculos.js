// Botões SÉC. XX / SÉC. XXI: o clicado fica preenchido em azul, o outro só com contorno,
// e o título da lateral acompanha. Por enquanto os dois séculos mostram os mesmos 6 cinemas.
(function () {
  var secao = document.getElementById('mapa');
  if (!secao) return;
  var titulo = document.getElementById('mapa-titulo');
  var botoes = secao.querySelectorAll('.botao-seculo');

  var ROTULOS = { xx: 'Séc. XX', xxi: 'Séc. XXI' };

  function definir(seculo) {
    secao.setAttribute('data-seculo', seculo);
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
