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
    attributionControl: true
  });

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


  // Cria os ícones, a camada e o popup dos cinemas
  async function adicionarCinemas() {
    if (!window.CINEMAS || !window.criarIconeCinema) return;

    // Garante que a Helvetica Bold esteja carregada antes de desenhar os números
    try { await document.fonts.load('700 80px "Helvetica Local"'); } catch (e) {}

    window.CINEMAS.forEach((cinema) => {
      const nome = 'cinema-' + cinema.id;
      if (!map.hasImage(nome)) map.addImage(nome, window.criarIconeCinema(cinema.id, 160));
    });

    map.addSource('cinemas', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: window.CINEMAS.map((c) => ({
          type: 'Feature',
          properties: { id: c.id, nome: c.nome, endereco: c.endereco },
          geometry: { type: 'Point', coordinates: c.coords }
        }))
      }
    });

    // Tamanho do ícone conforme o zoom: maior com o mapa afastado, menor com o mapa detalhado.
    // Em ~14.25 (abertura do mapa) fica no tamanho original.
    map.addLayer({
      id: 'camada-cinemas',
      type: 'symbol',
      source: 'cinemas',
      layout: {
        'icon-image': ['concat', 'cinema-', ['to-string', ['get', 'id']]],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 11.5, 0.45, 13, 0.385, 14.25, 0.32, 16, 0.22, 18, 0.155]
      }
    });

    // Clique: abre um balão com o nome e o endereço
    const popup = new maplibregl.Popup({ closeButton: false, offset: 18, maxWidth: '240px' });

    map.on('click', 'camada-cinemas', (e) => {
      const f = e.features[0];
      const el = document.createElement('div');
      const titulo = document.createElement('strong');
      titulo.textContent = f.properties.id + '. ' + f.properties.nome;
      const end = document.createElement('span');
      end.textContent = f.properties.endereco;
      el.append(titulo, end);
      popup.setLngLat(f.geometry.coordinates.slice()).setDOMContent(el).addTo(map);
    });

    map.on('mouseenter', 'camada-cinemas', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'camada-cinemas', () => { map.getCanvas().style.cursor = ''; });
  }

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
