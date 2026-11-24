// Leitor da revista com animação de virar página (StPageFlip)
(function () {
  var TOTAL = 72;                       // número de páginas em img/revista/
  var PASTA = 'img/revista/pagina-';    // pagina-01.jpg, pagina-02.jpg ...
  var LARG = 1100, ALT = 1001;          // proporção da página: 22 (L) × 20 (A) cm

  var livroEl = document.getElementById('livro');
  if (!livroEl) return;
  if (!window.St || !window.St.PageFlip) {
    livroEl.innerHTML = '<p class="revista__aviso">Não foi possível carregar o leitor.</p>';
    return;
  }

  function arquivo(i) { return PASTA + String(i + 1).padStart(2, '0') + '.jpg'; }

  // Cria as páginas (as imagens só carregam quando estão perto da página atual)
  var paginas = [];
  for (var i = 0; i < TOTAL; i++) {
    var pg = document.createElement('div');
    pg.className = 'revista__pagina';
    if (i === 0 || i === TOTAL - 1) pg.setAttribute('data-density', 'hard'); // capa e contracapa duras
    var img = document.createElement('img');
    img.alt = 'Página ' + (i + 1);
    img.decoding = 'async';
    img.draggable = false;
    img.dataset.src = arquivo(i);
    pg.appendChild(img);
    livroEl.appendChild(pg);
    paginas.push(img);
  }

  function carregarPerto(indice) {
    for (var j = Math.max(0, indice - 4); j <= Math.min(TOTAL - 1, indice + 6); j++) {
      var im = paginas[j];
      if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; }
    }
  }
  carregarPerto(0);

  var livro = new St.PageFlip(livroEl, {
    width: LARG,
    height: ALT,
    size: 'stretch',
    minWidth: 280,
    maxWidth: 2200,
    minHeight: 255,
    maxHeight: 2000,
    showCover: true,
    usePortrait: true,
    autoSize: true,
    maxShadowOpacity: 0.3,
    flippingTime: 820,
    mobileScrollSupport: true,
    swipeDistance: 30
  });
  livro.loadFromHTML(document.querySelectorAll('#livro .revista__pagina'));

  // Virada de página com ease-in-out (o StPageFlip anima em velocidade constante).
  // Os quadros da animação são reordenados pela curva: começa e termina devagar.
  (function () {
    var render = livro.getRender && livro.getRender();
    if (!render || typeof render.startAnimation !== 'function') return;
    var original = render.startAnimation.bind(render);
    function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    render.startAnimation = function (quadros, duracao, aoTerminar) {
      var n = quadros.length;
      if (n > 2) {
        quadros = quadros.map(function (_, i) {
          return quadros[Math.round(easeInOut(i / (n - 1)) * (n - 1))];
        });
      }
      return original(quadros, duracao, aoTerminar);
    };
  })();

  // Controles
  var contador = document.getElementById('revista-contador');
  var anterior = document.getElementById('revista-anterior');
  var proxima = document.getElementById('revista-proxima');
  var telaCheia = document.getElementById('revista-tela-cheia');
  var secao = document.getElementById('revista');

  function atualizar(indice) {
    carregarPerto(indice);
    var retrato = livro.getOrientation() === 'portrait';
    var texto;
    if (retrato || indice === 0 || indice === TOTAL - 1) {
      texto = (indice + 1) + ' / ' + TOTAL;
    } else {
      var esq = indice % 2 === 1 ? indice : indice - 1;
      texto = (esq + 1) + '–' + Math.min(esq + 2, TOTAL) + ' / ' + TOTAL;
    }
    contador.textContent = texto;
    anterior.disabled = indice === 0;
    proxima.disabled = indice >= TOTAL - 1;
  }

  livro.on('flip', function (e) { atualizar(e.data); });
  livro.on('changeOrientation', function () { atualizar(livro.getCurrentPageIndex()); });
  anterior.addEventListener('click', function () { livro.flipPrev(); });
  proxima.addEventListener('click', function () { livro.flipNext(); });

  // Clicar na revista dá foco a ela (o leitor de páginas pode cancelar o foco padrão do clique)
  var palco = secao.querySelector('.revista__palco');
  if (palco) secao.addEventListener('pointerdown', function (e) {
    if (!e.target.closest('button') && palco.focus) palco.focus({ preventScroll: true });
  }, true);

  // Setas do teclado, só com a revista em foco
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    // Só com o foco na revista (clicou nela ou chegou pelo Tab): no mapa e em campos as setas são deles
    var foco = document.activeElement;
    if (!foco || !secao.contains(foco)) return;
    if (e.key === 'ArrowRight') livro.flipNext();
    if (e.key === 'ArrowLeft') livro.flipPrev();
  });

  // Tela cheia
  if (!secao.requestFullscreen) {
    telaCheia.hidden = true;
  } else {
    telaCheia.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else secao.requestFullscreen();
    });
    document.addEventListener('fullscreenchange', function () {
      var ativo = document.fullscreenElement === secao;
      secao.classList.toggle('is-tela-cheia', ativo);
      telaCheia.setAttribute('aria-label', ativo ? 'Sair da tela cheia' : 'Tela cheia');
      // Recalcula o tamanho do livro depois que o layout muda
      setTimeout(function () { livro.update(); }, 60);
    });
  }

  atualizar(0);
})();
