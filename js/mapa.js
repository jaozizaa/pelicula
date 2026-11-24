// Mapa interativo de Belo Horizonte (MapLibre GL JS + OpenFreeMap)
(function () {
  if (typeof maplibregl === 'undefined') return; // CDN indisponível

  // Paleta da revista A Película
  const COR_RUAS = '#FFFFFF';
  const COR_FUNDO_BLOCOS = '#D2D2D2';
  const COR_TEXTO = '#434242';

  const map = new maplibregl.Map({
    container: 'map',
    // Fonte vetorial gratuita (OpenFreeMap)
    style: 'https://tiles.openfreemap.org/styles/positron',
    // Centro de Belo Horizonte (região da Av. Afonso Pena / Praça Sete)
    center: [-43.93105, -19.92137],
    zoom: 13.6,
    minZoom: 11.5,
    maxZoom: 18,
    // Limita a navegação para não sair da região de BH
    maxBounds: [
      [-44.08, -20.06], // Sudoeste
      [-43.82, -19.77]  // Nordeste
    ],
    attributionControl: true,
    // Rolagem da página não vira zoom: no computador, Ctrl/⌘ + rolagem; no celular, dois dedos
    cooperativeGestures: true,
    // Somente 2D: sem inclinação (Ctrl + arrastar) e sem rotação
    pitchWithRotate: false,
    dragRotate: false,
    maxPitch: 0,
    pitch: 0,
    locale: {
      'CooperativeGesturesHandler.WindowsHelpText': 'Use Ctrl + rolagem para dar zoom no mapa',
      'CooperativeGesturesHandler.MacHelpText': 'Use ⌘ + rolagem para dar zoom no mapa',
      'NavigationControl.ZoomIn': 'Aproximar o mapa',
      'NavigationControl.ZoomOut': 'Afastar o mapa',
      'AttributionControl.ToggleAttribution': 'Mostrar ou ocultar os créditos do mapa',
      'AttributionControl.MapFeedback': 'Enviar comentário sobre o mapa',
      'CooperativeGesturesHandler.MobileHelpText': 'Use dois dedos para mover o mapa'
    }
  });
  map.touchZoomRotate.disableRotation();
  if (map.touchPitch) map.touchPitch.disable();

  // Botões de zoom (+ / -) minimalistas no canto inferior direito
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  // Enquadramento inicial: zoom do print de 23/11, centralizado no conjunto dos 6 cinemas
  // (cantos sudoeste e nordeste do mapa). Como usa os cantos, o mesmo recorte aparece em qualquer tamanho de tela.
  const VISTA_INICIAL = [
    [-43.96094, -19.94893], // Sudoeste
    [-43.90117, -19.89382]  // Nordeste
  ];
  function enquadrarInicial() {
    map.fitBounds(VISTA_INICIAL, { padding: 0, animate: false });
  }

  map.once('load', enquadrarInicial);

  // O zoom do navegador (Ctrl + rolagem fora do mapa) e o redimensionamento da janela mudam o
  // tamanho do mapa em pixels. Sem isto, o MapLibre mantém o nível de zoom e a área visível muda
  // (o mapa parece aproximar/afastar sozinho). Aqui guardamos a área visível e a restauramos.
  let areaVisivel = null;
  map.on('moveend', () => { areaVisivel = map.getBounds(); });
  map.on('resize', () => {
    if (!areaVisivel) return;
    const area = areaVisivel;
    map.fitBounds(area, { padding: 0, animate: false });
    areaVisivel = area; // mantém a referência original, sem acumular arredondamentos
  });


  // Os dois conjuntos de cinemas: séc. XXI (js/cinemas.js, azul) e séc. XX (js/cinemas-xx.js, amarelo)
  const CONJUNTOS = {
    xxi: { dados: () => window.CINEMAS || [], camada: 'camada-cinemas', fonte: 'cinemas', prefixo: 'cinema-',
           cores: null,
           tamanho: ['interpolate', ['linear'], ['zoom'], 11.5, 0.45, 13, 0.385, 14.25, 0.32, 16, 0.22, 18, 0.155] },
    xx:  { dados: () => window.CINEMAS_XX || [], camada: 'camada-cinemas-xx', fonte: 'cinemas-xx', prefixo: 'cinema-xx-',
           cores: { fundo: '#FEB801', anel: '#FFFFFF', numero: '#0132CA' },
           // 86 cinemas: ícones menores e com variação mais suave, para não virarem um bolo no centro
           tamanho: ['interpolate', ['linear'], ['zoom'], 11.5, 0.2, 13, 0.21, 14.25, 0.22, 16, 0.2, 18, 0.18] }
  };
  let seculo = window.SECULO_ATUAL || 'xxi';
  const popup = new maplibregl.Popup({ closeButton: false, offset: 18, maxWidth: '260px' });
  // As animações do mapa não dependem de "reduzir movimento" (no Zen a preferência costuma vir ligada)
  const reduzir = false;

  // Aviso pequeno no canto do mapa (só no séc. XX)
  const aviso = document.createElement('p');
  aviso.className = 'mapa__aviso';
  aviso.append('Algumas localizações desses cinemas são aproximadas', document.createElement('br'), 'Fonte: “O Fim Das Coisas”');
  map.getContainer().appendChild(aviso);

  function abrirBalao(c) {
    const el = document.createElement('div');
    const titulo = document.createElement('strong');
    titulo.textContent = c.id + '. ' + c.nome;
    const end = document.createElement('span');
    end.textContent = c.endereco;
    el.append(titulo, end);
    if (c.ano) {
      const ano = document.createElement('span');
      ano.className = 'mapa__balao-ano';
      ano.textContent = 'Inaugurado em ' + c.ano;
      el.append(ano);
    }
    if (c.aproximado) {
      const ap = document.createElement('em');
      ap.textContent = 'Localização aproximada';
      el.append(ap);
    }
    popup.setLngLat(c.coords).setDOMContent(el).addTo(map);
    marcarNaLista(c.id);
  }

  function marcarNaLista(id) {
    document.querySelectorAll('.mapa__cinema').forEach((b) => {
      if (id !== null && String(b.dataset.cinema) === String(id)) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }
  popup.on('close', () => marcarNaLista(null));

  function irPara(c) {
    const destino = { center: c.coords, zoom: Math.max(map.getZoom(), 15.5) };
    let aberto = false;
    const abrir = () => { if (!aberto) { aberto = true; abrirBalao(c); } };
    map.once('moveend', abrir);
    setTimeout(abrir, reduzir ? 50 : 1400); // garante o balão mesmo se o mapa já estiver no lugar
    if (reduzir) map.jumpTo(destino); else map.flyTo(Object.assign({ duration: 1200, essential: true }, destino));
  }

  // Lista lateral (montada por js/seculos.js): clique leva o mapa até o cinema e abre o balão
  document.querySelector('.mapa__lista').addEventListener('click', (e) => {
    const b = e.target.closest('.mapa__cinema');
    if (!b) return;
    const c = CONJUNTOS[seculo].dados().find((x) => String(x.id) === b.dataset.cinema);
    if (c) irPara(c);
  });

  // Tamanho dos ícones proporcional ao tamanho do mapa na tela.
  // Referência: o mapa em tela cheia no computador (~1190 px de largura), onde os tamanhos foram
  // aprovados. Num mapa menor (janela estreita, celular) o enquadramento inicial fica com menos zoom;
  // aqui a curva é deslocada por essa diferença e os ícones encolhem na mesma proporção do mapa,
  // para a relação ícone/mapa ser a mesma da referência.
  const LARGURA_REF = 1190;
  function tamanhoProporcional(base, animado) {
    const w = map.getContainer().clientWidth || LARGURA_REF;
    const fator = Math.min(1, Math.max(0.45, w / LARGURA_REF)); // não deixa sumir no celular
    const desloc = Math.log2(LARGURA_REF / Math.max(w, 1));
    const novo = base.slice(0, 3);
    for (let k = 3; k < base.length; k += 2) {
      const tam = +Math.max(0.11, base[k + 1] * fator).toFixed(4); // mínimo ~18 px para tocar
      // animado: o tamanho vira "tamanho × progresso da feição" (a bolinha crescendo)
      novo.push(base[k] - desloc, animado ? ['*', tam, ['coalesce', ['get', 'esc'], 1]] : tam);
    }
    return novo;
  }
  function atualizarTamanhos() {
    Object.keys(CONJUNTOS).forEach((chave) => {
      const conj = CONJUNTOS[chave];
      if (map.getLayer(conj.camada)) map.setLayoutProperty(conj.camada, 'icon-size', tamanhoProporcional(conj.tamanho));
      if (map.getLayer(conj.camada + '-base')) map.setLayoutProperty(conj.camada + '-base', 'icon-size', tamanhoProporcional(conj.tamanho, true));
    });
  }
  map.on('resize', atualizarTamanhos);

  async function adicionarCinemas() {
    if (!window.criarIconeCinema) return;
    // Garante que a Helvetica Bold esteja carregada antes de desenhar os números
    try { await document.fonts.load('700 80px "Helvetica Local"'); } catch (e) {}

    Object.keys(CONJUNTOS).forEach((chave) => {
      const conj = CONJUNTOS[chave];
      const lista = conj.dados();
      lista.forEach((c) => {
        const nome = conj.prefixo + c.id;
        if (!map.hasImage(nome)) map.addImage(nome, window.criarIconeCinema(c.id, 160, conj.cores));
      });
      if (map.getSource(conj.fonte)) return;
      // Disco liso da cor do ícone: é a "bolinha" que cresce antes do número e do contorno aparecerem
      const discoNome = conj.prefixo + 'disco';
      if (!map.hasImage(discoNome)) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 160;
        const cx = cv.getContext('2d');
        cx.beginPath(); cx.arc(80, 80, 80, 0, Math.PI * 2); cx.fillStyle = (conj.cores && conj.cores.fundo) || '#0132CA'; cx.fill();
        map.addImage(discoNome, cx.getImageData(0, 0, 160, 160));
      }
      // esc = escala da bolinha (0→1); op = opacidade do ícone completo (0→1). Em repouso ficam em 1.
      conj.fc = {
        type: 'FeatureCollection',
        features: lista.slice().sort((a, b) => a.id - b.id).map((c) => ({
          type: 'Feature',
          properties: { id: c.id, esc: 1, op: 1 },
          geometry: { type: 'Point', coordinates: c.coords }
        }))
      };
      map.addSource(conj.fonte, { type: 'geojson', data: conj.fc });
      map.addLayer({
        id: conj.camada + '-base',
        type: 'symbol',
        source: conj.fonte,
        layout: {
          visibility: 'none',
          'icon-image': discoNome,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'symbol-sort-key': ['-', 0, ['get', 'id']],
          'icon-size': tamanhoProporcional(conj.tamanho, true)
        }
      });
      // Tamanho do ícone conforme o zoom: maior com o mapa afastado, menor com o mapa detalhado.
      // Em ~14.25 (abertura do mapa) fica no tamanho original.
      map.addLayer({
        id: conj.camada,
        type: 'symbol',
        source: conj.fonte,
        layout: {
          visibility: chave === seculo ? 'visible' : 'none',
          'icon-image': ['concat', conj.prefixo, ['to-string', ['get', 'id']]],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          // ícone de número menor por cima (ordem de desenho segue o id)
          'symbol-sort-key': ['-', 0, ['get', 'id']],
          'icon-size': tamanhoProporcional(conj.tamanho)
        },
        paint: { 'icon-opacity': ['coalesce', ['get', 'op'], 1] }
      });
      map.on('click', conj.camada, (e) => {
        const id = e.features[0].properties.id;
        const c = conj.dados().find((x) => x.id === id);
        if (c) abrirBalao(c);
      });
      map.on('mouseenter', conj.camada, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', conj.camada, () => { map.getCanvas().style.cursor = ''; });
    });
    aplicarSeculo(seculo, false);
  }

  // Animação dos ícones ao trocar de século: uma bolinha cresce e, logo depois, o contorno e o número
  // surgem. Um por vez, na ordem numerada, cada vez mais rápido. Curvas ease in-out (taste-skill).
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let tokenAnim = 0;

  function aplicarProgresso(conj) {
    const src = map.getSource(conj.fonte);
    if (src && conj.fc) src.setData(conj.fc);
  }
  function repousoIcones() {
    Object.keys(CONJUNTOS).forEach((chave) => {
      const conj = CONJUNTOS[chave];
      if (!conj.fc) return;
      conj.fc.features.forEach((f) => { f.properties.esc = 1; f.properties.op = 1; });
      aplicarProgresso(conj);
      if (map.getLayer(conj.camada + '-base')) map.setLayoutProperty(conj.camada + '-base', 'visibility', 'none');
    });
  }

  function animarIcones(conj, atraso) {
    const meu = ++tokenAnim;
    const feicoes = conj.fc.features;
    if (reduzir) { // sem movimento: os ícones já aparecem prontos
      map.setLayoutProperty(conj.camada, 'visibility', 'visible');
      return;
    }
    const n = feicoes.length;
    const T = Math.min(2800, 900 + n * 18);   // tempo até o último começar
    const DUR = 560;                           // a bolinha crescendo
    const FADE_INI = DUR * 0.7, FADE = 420;    // contorno e número depois da bolinha
    const inicios = feicoes.map((_, i) => T * (1 - Math.pow(1 - i / n, 1.8))); // intervalos cada vez menores
    const total = T + FADE_INI + FADE;
    feicoes.forEach((f) => { f.properties.esc = 0; f.properties.op = 0; });
    const base = conj.camada + '-base';

    function iniciar() {
      if (meu !== tokenAnim) return;
      map.setLayoutProperty(base, 'visibility', 'visible');
      map.setLayoutProperty(conj.camada, 'visibility', 'visible');
      const t0 = performance.now();
      (function quadro(agora) {
        if (meu !== tokenAnim) return;
        const t = agora - t0;
        feicoes.forEach((f, i) => {
          const u = t - inicios[i];
          f.properties.esc = +easeIO(Math.min(1, Math.max(0, u / DUR))).toFixed(3);
          f.properties.op = +easeIO(Math.min(1, Math.max(0, (u - FADE_INI) / FADE))).toFixed(3);
        });
        aplicarProgresso(conj);
        if (t < total) { requestAnimationFrame(quadro); return; }
        feicoes.forEach((f) => { f.properties.esc = 1; f.properties.op = 1; });
        aplicarProgresso(conj);
        map.setLayoutProperty(base, 'visibility', 'none');
      })(t0);
    }
    // Envia o estado zerado ao mapa antes de mostrar a camada, para os ícones não piscarem inteiros
    aplicarProgresso(conj);
    let ok = false;
    const liberar = () => { if (!ok) { ok = true; setTimeout(iniciar, atraso); } };
    const aoCarregar = (e) => {
      if (e.sourceId === conj.fonte && e.isSourceLoaded) { map.off('sourcedata', aoCarregar); liberar(); }
    };
    map.on('sourcedata', aoCarregar);
    setTimeout(() => { map.off('sourcedata', aoCarregar); liberar(); }, 200);
  }

  // Troca de século: mostra só a camada da época. O enquadramento é o mesmo do séc. XXI (mesma posição e zoom)
  function aplicarSeculo(novo, animar) {
    seculo = novo;
    popup.remove();
    aviso.classList.toggle('is-visivel', novo === 'xx');
    tokenAnim++;
    repousoIcones();
    Object.keys(CONJUNTOS).forEach((chave) => {
      const camada = CONJUNTOS[chave].camada;
      if (map.getLayer(camada)) map.setLayoutProperty(camada, 'visibility', chave === novo && animar !== false ? 'none' : (chave === novo ? 'visible' : 'none'));
    });
    if (animar === false) return;
    map.fitBounds(VISTA_INICIAL, { padding: 0, duration: reduzir ? 0 : 1400, essential: true });
    const conj = CONJUNTOS[novo];
    if (conj && conj.fc) animarIcones(conj, reduzir ? 0 : 450);
  }
  document.addEventListener('seculo', (e) => aplicarSeculo(e.detail, true));

  map.on('style.load', () => {
    const layers = map.getStyle().layers;

    layers.forEach((layer) => {
      const id = layer.id.toLowerCase();

      // 1. Pinta fundo, parques, água e quadras com #D2D2D2
      if (layer.type === 'background') {
        map.setPaintProperty(layer.id, 'background-color', COR_FUNDO_BLOCOS);
      }

      if (layer.type === 'fill') {
        // Oculta polígonos de prédios individuais para manter o visual limpo
        if (id.includes('building')) {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        } else {
          map.setPaintProperty(layer.id, 'fill-color', COR_FUNDO_BLOCOS);
          if (map.getPaintProperty(layer.id, 'fill-outline-color')) {
            map.setPaintProperty(layer.id, 'fill-outline-color', COR_FUNDO_BLOCOS);
          }
        }
      }

      // 2. Pinta ruas, avenidas e linhas em branco puro (#FFFFFF)
      if (layer.type === 'line') {
        if (
          id.includes('road') ||
          id.includes('highway') ||
          id.includes('street') ||
          id.includes('path') ||
          id.includes('bridge') ||
          id.includes('tunnel')
        ) {
          map.setPaintProperty(layer.id, 'line-color', COR_RUAS);

          // Ruas menores somem no zoom out (visão geral de BH)
          if (id.includes('minor') || id.includes('service') || id.includes('path')) {
            map.setLayerZoomRange(layer.id, 12.8, 24);
          }
        } else {
          // Remove fronteiras administrativas e linhas extras
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      }

      // 3. Textos: apenas nomes de ruas e bairros em #434242
      if (layer.type === 'symbol') {
        const isStreetLabel = id.includes('road') || id.includes('street') || id.includes('highway');
        const isNeighborhood = id.includes('place') || id.includes('suburb') || id.includes('neighbourhood');

        if (isStreetLabel) {
          map.setPaintProperty(layer.id, 'text-color', COR_TEXTO);
          map.setPaintProperty(layer.id, 'text-halo-color', COR_RUAS);
          map.setPaintProperty(layer.id, 'text-halo-width', 1.5);
          // Nomes das ruas só aparecem com bastante zoom (a partir do 16)
          map.setLayerZoomRange(layer.id, 16, 24);
        } else if (isNeighborhood) {
          map.setPaintProperty(layer.id, 'text-color', COR_TEXTO);
          map.setPaintProperty(layer.id, 'text-halo-color', COR_FUNDO_BLOCOS);
          map.setPaintProperty(layer.id, 'text-halo-width', 1.5);
          // Nomes de bairros aparecem no zoom intermediário e somem de perto
          map.setLayerZoomRange(layer.id, 12.2, 15.2);
        } else {
          // Remove ícones e textos de comércios, hospitais, pontos de ônibus etc.
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      }
    });

    // -----------------------------------------------------------------------
    // Ícones numerados dos cinemas (desenhados por código em js/cinemas.js)
    // -----------------------------------------------------------------------
    adicionarCinemas();
  });
})();
