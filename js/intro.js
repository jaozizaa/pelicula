// Abertura do site: texto datilografado sobre o azul, depois o azul sobe e vira o header.
// Ordem: parágrafo → "Hoje restam 6." → azul sobe → logo e links (esquerda → direita) → foto → subtítulo.
(function () {
  var html = document.documentElement;
  var intro = document.getElementById('intro');
  if (!intro) return;
  if (!html.classList.contains('com-intro')) { intro.remove(); return; }
  // A foto do hero fica parada durante e depois da abertura: sem a animação de entrada própria do hero
  var hero = document.querySelector('.hero[data-enter]');
  if (hero) hero.removeAttribute('data-enter');

  var TEXTOS = [
    'No século XX, a capital mineira Belo Horizonte contava com mais de 100 salas de cinema de rua. ' +
    'Diversos bairros da cidade tinham um lugar para que os moradores pudessem assistir filmes e ' +
    'aproveitar os finais de semana.',
    'Hoje restam 6.'
  ];
  var VELOCIDADE = [30, 75];   // ms por letra em cada texto
  var PAUSA = [1800, 1600];    // ms parado depois de completo

  var caixa = document.getElementById('intro-texto');
  var pular = document.getElementById('intro-pular');
  var topo = document.getElementById('topo');
  var timers = [];
  var terminou = false;

  function depois(ms, fn) { timers.push(setTimeout(fn, ms)); }
  try { sessionStorage.setItem('pelicula-intro', '1'); } catch (e) {}
  window.scrollTo(0, 0);
  // Alguns navegadores restauram a rolagem só depois do carregamento: volta ao topo de novo
  window.addEventListener('load', function () { window.scrollTo(0, 0); });

  // Monta o texto inteiro em letras invisíveis: as linhas já ficam na posição final
  function montar(texto) {
    caixa.classList.remove('sai');
    caixa.textContent = '';
    var letras = [];
    texto.split(/(\s+)/).forEach(function (pedaco) {
      if (!pedaco) return;
      if (/^\s+$/.test(pedaco)) { caixa.appendChild(document.createTextNode(' ')); return; }
      var palavra = document.createElement('span');
      palavra.style.whiteSpace = 'nowrap';
      palavra.style.opacity = '1';
      for (var k = 0; k < pedaco.length; k++) {
        var l = document.createElement('span');
        l.textContent = pedaco[k];
        palavra.appendChild(l);
        letras.push(l);
      }
      caixa.appendChild(palavra);
    });
    return letras;
  }

  function datilografar(indice) {
    if (terminou) return;
    if (indice >= TEXTOS.length) { subir(); return; }
    var letras = montar(TEXTOS[indice]);
    var i = 0;
    (function proxima() {
      if (terminou) return;
      if (i < letras.length) {
        letras[i++].className = 'on';
        depois(VELOCIDADE[indice], proxima);
      } else {
        depois(PAUSA[indice], function () {
          caixa.classList.add('sai');
          depois(650, function () { datilografar(indice + 1); });
        });
      }
    })();
  }

  function subir() {
    if (terminou) return;
    caixa.classList.add('sai');
    // O azul "sobe": recorta de baixo para cima até sobrar só a altura do header
    var h = topo.offsetHeight;
    intro.style.clipPath = 'inset(0 0 calc(100% - ' + h + 'px) 0)';
    intro.classList.add('sobe');
    html.classList.add('intro-sobe');
    depois(1320, revelar);          // o header entra quando o azul termina de subir
  }

  function revelar() {
    if (terminou) return;
    terminou = true;
    window.scrollTo(0, 0);
    // A faixa azul que sobrou tem a mesma cor e altura do header: some sem corte visível
    intro.style.visibility = 'hidden';
    html.classList.add('intro-header');
    setTimeout(function () {
      document.dispatchEvent(new Event('intro-fim'));
      intro.remove();
      html.classList.remove('com-intro', 'intro-sobe', 'intro-header');
    }, 1400);
  }

  // Pular: vai direto ao final (com a subida do azul, que é rápida)
  function pularIntro() {
    if (terminou || intro.classList.contains('sobe')) return;
    timers.forEach(clearTimeout);
    timers = [];
    subir();
  }
  pular.addEventListener('click', pularIntro);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      if (html.classList.contains('com-intro') && !intro.classList.contains('sobe')) { e.preventDefault(); pularIntro(); }
    }
  });

  // Espera a fonte carregar para as linhas não mudarem durante a digitação
  var comecar = function () { depois(500, function () { datilografar(0); }); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(comecar); else comecar();
})();
