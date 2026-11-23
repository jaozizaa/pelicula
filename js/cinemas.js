// Dados dos cinemas e ícone numerado desenhado por código.
// Para ajustar a posição de um cinema, mude "coords" ([longitude, latitude]).

window.CINEMAS = [
  {
    id: 1,
    nome: 'Theatro Brasil',
    endereco: 'Av. Amazonas, 315 — Centro',
    coords: [-43.9379691, -19.9190461]
  },
  {
    id: 2,
    nome: 'Humberto Mauro',
    endereco: 'Palácio das Artes — Av. Afonso Pena, 1537, Centro',
    coords: [-43.9335244, -19.925852]
  },
  {
    id: 3,
    nome: 'Belas Artes',
    endereco: 'Rua Gonçalves Dias, 1581 — Lourdes',
    coords: [-43.9396044, -19.9308357]
  },
  {
    id: 4,
    nome: 'Minas Tênis',
    endereco: 'Rua da Bahia, 2244 — Lourdes',
    coords: [-43.9410098, -19.9352484]
  },
  {
    id: 5,
    nome: 'Graciano',
    endereco: 'Rua Itapecerica, 468 — Lagoinha',
    // Posição aproximada (meio da Rua Itapecerica); ajuste se tiver o ponto exato
    coords: [-43.9453, -19.9075]
  },
  {
    id: 6,
    nome: 'Santa Tereza',
    endereco: 'Rua Estrela do Sul, 89 — Santa Tereza',
    coords: [-43.9168092, -19.9163137]
  }
];

// Desenha o ícone: círculo azul, anel branco, miolo azul e número em Helvetica Bold.
// Proporções medidas a partir do ícone do Figma (78 px): raios 1 / 0,795 / 0,692
// e número com altura de ~35% do diâmetro.
window.criarIconeCinema = function (numero, diametro) {
  var D = diametro || 160;
  var AZUL = '#0132CA';
  var BRANCO = '#FFFFFF';
  var canvas = document.createElement('canvas');
  canvas.width = D;
  canvas.height = D;
  var ctx = canvas.getContext('2d');
  var c = D / 2;

  function disco(raio, cor) {
    ctx.beginPath();
    ctx.arc(c, c, raio, 0, Math.PI * 2);
    ctx.fillStyle = cor;
    ctx.fill();
  }

  disco(c, AZUL);            // borda externa azul
  disco(c * 0.795, BRANCO);  // anel branco
  disco(c * 0.692, AZUL);    // miolo azul

  // Número em Helvetica Bold, centralizado pelo contorno real do glifo
  ctx.fillStyle = BRANCO;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 ' + Math.round(D * 0.5) + 'px "Helvetica Local", "Helvetica Neue", Helvetica, Arial, sans-serif';
  var texto = String(numero);
  var m = ctx.measureText(texto);
  var altura = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  var y = c + altura / 2 - m.actualBoundingBoxDescent;
  var x = c + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
  ctx.fillText(texto, x, y);

  return ctx.getImageData(0, 0, D, D);
};

// Ícone do século XX: estrela azul com o número em branco (Star 18 do Figma, 32 px).
window.criarIconeEstrela = function (numero, tamanho) {
  var D = tamanho || 160;
  var AZUL = '#0132CA';
  var BRANCO = '#FFFFFF';
  // Vértices da estrela (mesmos pontos de img/estrela.svg, em 44,09 × 46,36)
  var PONTOS = [
    [22.0449, 0], [25.1965, 13.4796], [35.6693, 4.42686], [30.296, 17.1846], [44.0897, 16.0165],
    [32.2438, 23.1793], [44.0897, 30.3422], [30.296, 29.1741], [35.6693, 41.9318], [25.1965, 32.8791],
    [22.0449, 46.3587], [18.8932, 32.8791], [8.42039, 41.9318], [13.7938, 29.1741], [0, 30.3422],
    [11.846, 23.1793], [0, 16.0165], [13.7938, 17.1846], [8.42039, 4.42686], [18.8932, 13.4796]
  ];
  var canvas = document.createElement('canvas');
  canvas.width = D;
  canvas.height = D;
  var ctx = canvas.getContext('2d');

  ctx.beginPath();
  PONTOS.forEach(function (p, i) {
    var x = p[0] / 44.0897 * D, y = p[1] / 46.3587 * D;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = AZUL;
  ctx.fill();

  ctx.fillStyle = BRANCO;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 ' + Math.round(D * 0.36) + 'px "Helvetica Local", "Helvetica Neue", Helvetica, Arial, sans-serif';
  var texto = String(numero);
  var m = ctx.measureText(texto);
  var altura = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  var c = D / 2;
  var y = c + altura / 2 - m.actualBoundingBoxDescent;
  var x = c + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
  ctx.fillText(texto, x, y);

  return ctx.getImageData(0, 0, D, D);
};
