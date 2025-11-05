// Variáveis globais para controlar a webcam e a deteção de mãos
let video; // Elemento de vídeo onde aparece a webcam
let handDetector; // O detetor de mãos da biblioteca MediaPipe
let canvas; // Canvas onde vamos desenhar as mãos detetadas
let ctx; // Contexto 2D do canvas para fazer os desenhos
let hands = []; // Array que guarda as mãos detetadas em cada frame

// Configuração dos resíduos do jogo
// Cada tipo de resíduo tem a sua imagem, o ecoponto certo onde deve ir parar e um som
const RESIDUOS_CONFIG = {
  papel: {
    img: "../assets/img/residuos/papel.png",
    ecoponto: "azul",
    sound: "../assets/sound/papel.mp3",
  },
  vidro: {
    img: "../assets/img/residuos/vidro.png",
    ecoponto: "verde",
    sound: "../assets/sound/vidro.mp3",
  },
  plastico: {
    img: "../assets/img/residuos/plastico.png",
    ecoponto: "amarelo",
    sound: "../assets/sound/plastico.mp3",
  },
  lixo: {
    img: "../assets/img/residuos/lixo.png",
    ecoponto: "cinzento",
    sound: "../assets/sound/lixo.mp3",
  },
};

// Variáveis para controlar o estado do jogo
let residuosAtivos = []; // Lista de todos os resíduos que estão no ecrã
let residuoSelecionado = null; // O resíduo que está destacado (quando a mão está perto dele)
let residuoAgarrado = null; // O resíduo que estamos a segurar neste momento
let ecopontoSelecionado = null; // O ecoponto que está destacado (quando estamos perto dele com um resíduo)
let pontuacao = 0; // A pontuação atual do jogador
let posicaoOriginal = null; // Guarda a posição inicial de um resíduo para o caso de largarmos fora de um ecoponto

// Variáveis para o modo de controlo com o rato
let isMouseMode = false;
let mouseCursor;
let isMouseDown = false;

/**
 * Inicializa o sistema de jogo, configurando webcam e deteção de mãos ou modo rato
 * @async
 */
async function setup() {
  // Verificar se foi definido um modo de jogo específico
  const modoDefinido = localStorage.getItem("modo_jogo");

  // Se o utilizador escolheu o modo rato, iniciar com o rato
  if (modoDefinido === "mouse") {
    isMouseMode = true;
    initMouseControls();
    return;
  }

  // Buscar os elementos HTML que vamos usar
  video = document.getElementById("videoCanvas");
  canvas = document.getElementById("handCanvas");
  ctx = canvas.getContext("2d");

  // Fazer o canvas ocupar o ecrã todo
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Se redimensionarmos a janela, ajustamos o canvas também
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  try {
    // Configurações para pedir acesso à webcam
    // Pedimos uma resolução HD porque ajuda na deteção das mãos
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user", // Câmara da frente
      },
      audio: false, // Não precisamos de áudio
    };

    // Pedir permissão e acesso à webcam
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Quando o vídeo estiver pronto, inicializamos a deteção de mãos
    video.addEventListener("loadedmetadata", async () => {
      video.play();
      await initHandDetection();
      detectHands(); // Começar a detetar mãos continuamente
    });
  } catch (error) {
    console.error("Erro ao aceder à webcam:", error);
    alert(
      "Não foi possível aceder à webcam. O jogo continuará com os controlos do rato."
    );
    isMouseMode = true;
    initMouseControls();
  }
}

/**
 * Inicializa os controlos do rato como alternativa à webcam
 */
function initMouseControls() {
  // Buscar os elementos HTML que vamos usar
  video = document.getElementById("videoCanvas");
  canvas = document.getElementById("handCanvas");
  ctx = canvas.getContext("2d");

  // Fazer o canvas ocupar o ecrã todo
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Se redimensionarmos a janela, ajustamos o canvas também
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // Esconde os elementos de vídeo e canvas que não são necessários
  video.style.display = "none";
  canvas.style.display = "none";

  // Cria um elemento para servir de cursor customizado
  mouseCursor = document.createElement("div");
  mouseCursor.id = "mouseCursor";
  document.body.appendChild(mouseCursor);
  document.body.style.cursor = "none"; // Esconde o cursor real do sistema

  // Adiciona os listeners para os eventos do rato
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);

  console.log("Modo rato inicializado com sucesso");
}

/**
 * Processa o movimento do rato e atualiza a posição do cursor e resíduos
 * @param {MouseEvent} event - Evento de movimento do rato
 */
function handleMouseMove(event) {
  if (!mouseCursor) return; // Garantir que o cursor foi inicializado

  const mouseX = event.clientX;
  const mouseY = event.clientY;

  // Move o cursor customizado
  mouseCursor.style.left = `${mouseX}px`;
  mouseCursor.style.top = `${mouseY}px`;

  // Se não estivermos a agarrar um resíduo, verifica a colisão com os resíduos
  if (!residuoAgarrado) {
    verificarColisaoResiduos(mouseX, mouseY);
  } else {
    // Se estivermos a agarrar, move o resíduo e verifica a colisão com os ecopontos
    moverResiduoAgarrado(mouseX, mouseY);
    verificarColisaoEcopontos(mouseX, mouseY);
  }
}

/**
 * Processa o clique do botão esquerdo do rato
 * @param {MouseEvent} event - Evento de pressionar o botão do rato
 */
function handleMouseDown(event) {
  if (event.button !== 0) return; // Apenas para o botão esquerdo
  isMouseDown = true;
  if (mouseCursor) {
    mouseCursor.classList.add("grabbing"); // Animação de agarrar no cursor
  }

  // Se houver um resíduo selecionado, agarra-o
  if (residuoSelecionado) {
    agarrarResiduo();
  }
}

/**
 * Processa a libertação do botão esquerdo do rato
 * @param {MouseEvent} event - Evento de libertar o botão do rato
 */
function handleMouseUp(event) {
  if (event.button !== 0) return; // Apenas para o botão esquerdo
  isMouseDown = false;
  if (mouseCursor) {
    mouseCursor.classList.remove("grabbing"); // Remove a animação de agarrar
  }

  // Se estivermos a agarrar um resíduo, larga-o
  if (residuoAgarrado) {
    largarResiduo(event.clientX, event.clientY);
  }
}

/**
 * Inicializa o sistema de deteção de mãos usando o MediaPipe
 * @async
 */
async function initHandDetection() {
  // Escolher o modelo MediaPipeHands que é bastante preciso
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: "mediapipe", // Usar a versão MediaPipe
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
    maxHands: 1, // Detetar até 2 mãos ao mesmo tempo (Apenas uma para evitar o bug do teleporte)
    modelType: "full", // Modelo completo, mais preciso que o "lite"
  };

  handDetector = await handPoseDetection.createDetector(model, detectorConfig);
  console.log("Detetor de mãos inicializado");
}

/**
 * Loop contínuo de deteção de mãos em cada frame
 * @async
 */
async function detectHands() {
  // Só tenta detetar se o vídeo estiver pronto (readyState 4 = tudo carregado)
  if (handDetector && video.readyState === 4) {
    hands = await handDetector.estimateHands(video);
    drawHands(); // Desenhar as mãos detetadas
  }

  requestAnimationFrame(detectHands);
}

/**
 * Desenha as mãos detetadas no canvas e processa a interação com resíduos
 */
function drawHands() {
  // Limpar o canvas antes de desenhar as novas posições
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Se detetarmos pelo menos uma mão
  if (hands.length > 0) {
    hands.forEach((hand) => {
      // Keypoints são os 21 pontos que o MediaPipe deteta em cada mão
      const keypoints = hand.keypoints;

      // O keypoint 8 é a ponta do dedo indicador, vamos usar isso como "cursor"
      const indicadorPonta = keypoints[8];
      // Invertemos o X porque a webcam está espelhada
      const indicadorX =
        canvas.width - (indicadorPonta.x / video.videoWidth) * canvas.width;
      const indicadorY = (indicadorPonta.y / video.videoHeight) * canvas.height;

      // Verificar se os dedos estão juntos (gesto de agarrar)
      const dedosJuntos = verificarDedosJuntos(keypoints);

      // Desenhar cada ponto da mão
      keypoints.forEach((point, index) => {
        // Converter as coordenadas do vídeo para o canvas
        const x = canvas.width - (point.x / video.videoWidth) * canvas.width;
        const y = (point.y / video.videoHeight) * canvas.height;
        const z = point.z || 0; // Profundidade do ponto

        // O tamanho do ponto varia com a profundidade para dar sensação de 3D
        const size = 8 + z * 0.5;

        // Desativar o suavização para manter o visual pixel art
        ctx.imageSmoothingEnabled = false;

        // Desenhar o ponto com cor verde que varia com a profundidade
        ctx.fillStyle = `hsl(${120 + z * 10}, 80%, 60%)`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);

        // Adicionar uma borda ao ponto
        ctx.strokeStyle = "#4a9d4a";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);

        // Se for a ponta do indicador (index 8) e tivermos um resíduo agarrado
        if (index === 8) {
          if (residuoAgarrado) {
            moverResiduoAgarrado(x, y);
            verificarColisaoEcopontos(x, y);

            // Se abrirmos os dedos, largamos o resíduo
            if (!dedosJuntos) {
              largarResiduo(x, y);
            }
          }
        }
      });

      // Desenhar as linhas que ligam os pontos da mão
      drawConnections(keypoints);

      // Se não estivermos a segurar nada, verificamos se estamos perto de algum resíduo
      if (!residuoAgarrado) {
        verificarColisaoResiduos(indicadorX, indicadorY);

        // Se juntarmos os dedos perto de um resíduo, agarramos
        if (dedosJuntos && residuoSelecionado) {
          agarrarResiduo();
        }
      }
    });
  } else {
    // Se não houver mãos detetadas, limpamos as seleções
    limparSelecao();
    limparEcopontoSelecionado();
  }
}

/**
 * Desenha as linhas que ligam os pontos da mão para formar o esqueleto
 * @param {Array} keypoints - Array com os 21 pontos da mão detetados pelo MediaPipe
 */
function drawConnections(keypoints) {
  // Array com os pares de pontos que devem ser ligados
  // Por exemplo, [0,1] liga o pulso ao início do polegar
  const connections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4], // Polegar
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8], // Indicador
    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12], // Médio
    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16], // Anelar
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20], // Mindinho
    [5, 9],
    [9, 13],
    [13, 17], // Ligações da palma
  ];

  ctx.strokeStyle = "#4a9d4a";
  ctx.lineWidth = 15;
  ctx.lineCap = "round";

  // Desenhar cada ligação
  connections.forEach(([start, end]) => {
    const startPoint = keypoints[start];
    const endPoint = keypoints[end];

    // Converter coordenadas para o canvas (invertendo X)
    const x1 = canvas.width - (startPoint.x / video.videoWidth) * canvas.width;
    const y1 = (startPoint.y / video.videoHeight) * canvas.height;
    const x2 = canvas.width - (endPoint.x / video.videoWidth) * canvas.width;
    const y2 = (endPoint.y / video.videoHeight) * canvas.height;

    // Desenhar a linha de forma pixelizada
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    ctx.moveTo(Math.round(x1), Math.round(y1));
    ctx.lineTo(Math.round(x2), Math.round(y2));
    ctx.stroke();
  });
}

/**
 * Verifica proximidade da mão com resíduos e destaca o mais próximo
 * @param {number} handX - Coordenada X da posição da mão
 * @param {number} handY - Coordenada Y da posição da mão
 */
function verificarColisaoResiduos(handX, handY) {
  let residuoMaisProximo = null;
  let menorDistancia = Infinity;

  // Percorrer todos os resíduos que estão no ecrã
  residuosAtivos.forEach((residuo) => {
    // Se já estiver agarrado, ignorar
    if (residuo.elemento.classList.contains("grabbed")) return;

    // Calcular o centro do resíduo
    const rect = residuo.elemento.getBoundingClientRect();
    const residuoX = rect.left + rect.width / 2;
    const residuoY = rect.top + rect.height / 2;

    // Calcular distância entre a mão e o resíduo usando Pitágoras
    const distancia = Math.sqrt(
      Math.pow(handX - residuoX, 2) + Math.pow(handY - residuoY, 2)
    );

    // Raio em que consideramos que estamos "perto" do resíduo
    const raioColisao = 80;

    // Se estiver dentro do raio e for o mais próximo até agora
    if (distancia < raioColisao && distancia < menorDistancia) {
      menorDistancia = distancia;
      residuoMaisProximo = residuo;
    }
  });

  // Se mudámos de resíduo, atualizar o destacado
  if (residuoMaisProximo !== residuoSelecionado) {
    limparSelecao();

    if (residuoMaisProximo) {
      residuoMaisProximo.elemento.classList.add("highlighted");
      residuoSelecionado = residuoMaisProximo;
    }
  }
}

/**
 * Deteta o gesto de pinça verificando a proximidade dos dedos ao polegar
 * @param {Array} keypoints - Array com os 21 pontos da mão detetados pelo MediaPipe
 * @returns {boolean} True se pelo menos 3 dedos estiverem próximos do polegar
 */
function verificarDedosJuntos(keypoints) {
  // Buscar as pontas de cada dedo
  const polegar = keypoints[4];
  const indicador = keypoints[8];
  const medio = keypoints[12];
  const anelar = keypoints[16];
  const mindinho = keypoints[20];

  const pontas = [indicador, medio, anelar, mindinho];

  // Contar quantos dedos estão perto do polegar
  let dedosProximos = 0;
  pontas.forEach((ponta) => {
    const distancia = Math.sqrt(
      Math.pow(polegar.x - ponta.x, 2) + Math.pow(polegar.y - ponta.y, 2)
    );

    // Se o dedo estiver perto do polegar, incrementar contador
    if (distancia <= 80) {
      dedosProximos++;
    }
  });

  return dedosProximos >= 3;
}

/**
 * Agarra o resíduo selecionado e prepara para movimentação
 */
function agarrarResiduo() {
  if (!residuoSelecionado) return;

  // Passar o resíduo selecionado para agarrado
  residuoAgarrado = residuoSelecionado;
  residuoAgarrado.elemento.classList.remove("highlighted");
  residuoAgarrado.elemento.classList.add("grabbed");

  // Guardar a posição original para o caso de largarmos fora de um ecoponto
  posicaoOriginal = {
    left: residuoAgarrado.elemento.style.left,
    bottom: residuoAgarrado.elemento.style.bottom,
    top: residuoAgarrado.elemento.style.top,
    position: residuoAgarrado.elemento.style.position || "absolute",
  };

  // Mudar para position fixed para seguir a mão por todo o ecrã
  residuoAgarrado.elemento.style.position = "fixed";
  residuoSelecionado = null;
}

/**
 * Move o resíduo agarrado para seguir a posição da mão ou rato
 * @param {number} handX - Coordenada X da posição da mão ou rato
 * @param {number} handY - Coordenada Y da posição da mão ou rato
 */
function moverResiduoAgarrado(handX, handY) {
  if (!residuoAgarrado) return;

  const elemento = residuoAgarrado.elemento;

  // Se estivermos em modo rato, as coordenadas já são relativas à janela
  if (isMouseMode) {
    elemento.style.left = `${handX}px`;
    elemento.style.top = `${handY}px`;
    elemento.style.bottom = "auto";
    elemento.style.transform = "translate(-50%, -50%)";
  } else {
    // No modo webcam, as coordenadas são relativas ao canvas
    const canvasRect = canvas.getBoundingClientRect();
    elemento.style.left = `${canvasRect.left + handX}px`;
    elemento.style.top = `${canvasRect.top + handY}px`;
    elemento.style.bottom = "auto";
    elemento.style.transform = "translate(-50%, -50%)";
  }
}

/**
 * Verifica proximidade da mão com ecopontos enquanto segura um resíduo
 * @param {number} handX - Coordenada X da posição da mão
 * @param {number} handY - Coordenada Y da posição da mão
 */
function verificarColisaoEcopontos(handX, handY) {
  const ecopontos = document.querySelectorAll(".ecoponto");
  let ecopontoMaisProximo = null;

  // Verificar colisão retangular para cada ecoponto
  ecopontos.forEach((ecoponto) => {
    const rect = ecoponto.getBoundingClientRect();

    // Expandir a área de colisão em 50px em todas as direções
    const margem = 50;
    const dentroX = handX >= rect.left - margem && handX <= rect.right + margem;
    const dentroY = handY >= rect.top - margem && handY <= rect.bottom + margem;

    // Se a mão está dentro da área expandida do ecoponto
    if (dentroX && dentroY) {
      ecopontoMaisProximo = {
        elemento: ecoponto,
        tipo: ecoponto.dataset.type,
      };
    }
  });

  // Atualizar o ecoponto destacado se mudou
  if (ecopontoMaisProximo !== ecopontoSelecionado) {
    limparEcopontoSelecionado();

    if (ecopontoMaisProximo) {
      ecopontoMaisProximo.elemento.classList.add("highlighted");
      ecopontoSelecionado = ecopontoMaisProximo;
    }
  }
}

/**
 * Larga o resíduo agarrado no ecoponto ou devolve à posição original
 * @param {number} handX - Coordenada X da posição da mão
 * @param {number} handY - Coordenada Y da posição da mão
 */
function largarResiduo(handX, handY) {
  if (!residuoAgarrado) return;

  const residuo = residuoAgarrado;

  // Se largámos sobre um ecoponto
  if (ecopontoSelecionado) {
    // Verificar se colocámos no ecoponto correto
    const ecopontoCerto = residuo.ecoponto === ecopontoSelecionado.tipo;

    // Adicionar classes para a animação de desaparecimento
    residuo.elemento.classList.remove("grabbed");
    residuo.elemento.classList.add("dropanimation");

    // Dar pontos ou retirar dependendo se acertámos
    if (ecopontoCerto) {
      adicionarPontos(5);
      reproduzirSom(residuo.tipo); // Som de sucesso
    } else {
      adicionarPontos(-10); // Penalização por erro
    }

    // Depois da animação, remover o resíduo do jogo
    setTimeout(() => {
      residuo.elemento.remove();
      residuosAtivos = residuosAtivos.filter((r) => r !== residuo);

      // Se não restam resíduos, o jogo acabou
      if (residuosAtivos.length === 0) {
        setTimeout(() => {
          mostrarModalFimJogo();
        }, 500);
      }
    }, 500); // Reduzido para 500ms para uma resposta mais rápida

    residuoAgarrado = null;
    posicaoOriginal = null;
    limparEcopontoSelecionado();
  } else {
    // Se largámos fora de um ecoponto, devolver à posição original
    residuo.elemento.classList.remove("grabbed");

    if (posicaoOriginal) {
      // Restaurar a posição original mantendo o position correto
      residuo.elemento.style.position = posicaoOriginal.position;
      residuo.elemento.style.left = posicaoOriginal.left;
      residuo.elemento.style.top = posicaoOriginal.top || "auto";
      residuo.elemento.style.bottom = posicaoOriginal.bottom || "auto";

      // Aplicar transição suave de retorno
      residuo.elemento.style.transition =
        "left 0.3s ease, top 0.3s ease, bottom 0.3s ease";

      // Forçar reflow para que a transição seja aplicada
      void residuo.elemento.offsetWidth;

      // Remover a transição depois da animação
      setTimeout(() => {
        residuo.elemento.style.transition = "";
      }, 300);
    }

    residuoAgarrado = null;
    posicaoOriginal = null;
  }
}

/**
 * Reproduz o som associado ao tipo de resíduo
 * @param {string} tipoResiduo - Tipo do resíduo (papel, vidro, plastico, lixo)
 */
function reproduzirSom(tipoResiduo) {
  const soundPath = RESIDUOS_CONFIG[tipoResiduo].sound;
  const audio = new Audio(soundPath);
  audio.volume = 0.5; // Volume a meio para não ser demasiado alto
  audio.play().catch((error) => {
    console.log("Erro ao reproduzir som:", error);
  });
}

/**
 * Atualiza a pontuação e aplica feedback visual
 * @param {number} pontos - Quantidade de pontos a adicionar (pode ser negativo)
 */
function adicionarPontos(pontos) {
  pontuacao += pontos;
  const pontuacaoElemento = document.querySelector("#pontuacao .pontos");
  pontuacaoElemento.textContent = pontuacao;

  // Feedback visual: verde quando ganhamos pontos, vermelho quando perdemos
  if (pontos > 0) {
    pontuacaoElemento.style.color = "#6bc56b";
  } else {
    pontuacaoElemento.style.color = "#ff4444";
    // Voltar à cor verde depois de meio segundo
    setTimeout(() => {
      pontuacaoElemento.style.color = "#6bc56b";
    }, 500);
  }
}

/**
 * Remove o destaque visual do resíduo selecionado
 */
function limparSelecao() {
  if (residuoSelecionado) {
    residuoSelecionado.elemento.classList.remove("highlighted");
    residuoSelecionado = null;
  }
}

/**
 * Remove o destaque visual do ecoponto selecionado
 */
function limparEcopontoSelecionado() {
  if (ecopontoSelecionado) {
    ecopontoSelecionado.elemento.classList.remove("highlighted");
    ecopontoSelecionado = null;
  }
}

/**
 * Carrega as quantidades configuradas de cada tipo de resíduo do localStorage
 * @returns {Object} Objeto com as quantidades de papel, vidro, plástico e lixo
 */
function carregarQuantidadesResiduos() {
  const quantidades = {
    papel: parseInt(localStorage.getItem("residuos_papel")) || 0,
    vidro: parseInt(localStorage.getItem("residuos_vidro")) || 0,
    plastico: parseInt(localStorage.getItem("residuos_plastico")) || 0,
    lixo: parseInt(localStorage.getItem("residuos_lixo")) || 0,
  };

  return quantidades;
}

/**
 * Cria e posiciona todos os resíduos no ecrã organizados em colunas
 */
function renderizarResiduos() {
  const container = document.getElementById("residuosContainer");
  container.innerHTML = ""; // Limpar resíduos anteriores
  residuosAtivos = [];

  const quantidades = carregarQuantidadesResiduos();
  const containerWidth = window.innerWidth;

  // Dividir o espaço em 4 "colunas" (uma para cada tipo de resíduo)
  // Centradas na mesma posição dos ecopontos
  const numSlots = 4;
  const centerX = containerWidth / 2;
  const slotGap = 80; // Mesmo espaço que os resíduos
  const slotWidth = ((numSlots - 1) * slotGap) / numSlots;

  const tipos = ["papel", "vidro", "plastico", "lixo"];
  // Baralhar os tipos para aparecerem em ordem aleatória
  const tiposAleatorios = [...tipos].sort(() => Math.random() - 0.5);

  // Posicionar cada tipo de resíduo centrado na mesma coluna do respetivo ecoponto
  tiposAleatorios.forEach((tipo, slotIndex) => {
    const quantidade = quantidades[tipo];
    const config = RESIDUOS_CONFIG[tipo];

    // Calcular o centro desta coluna alinhado com os ecopontos
    const offset = (slotIndex - (numSlots - 1) / 2) * (280 + slotGap);
    const slotCenterX = centerX + offset;

    // Criar cada resíduo deste tipo
    for (let i = 0; i < quantidade; i++) {
      const img = document.createElement("img");
      img.src = config.img;
      img.className = "residuo";
      img.dataset.tipo = tipo;
      img.dataset.ecoponto = config.ecoponto;

      // Posicionar na parte inferior do ecrã
      const baseY = window.innerHeight - 120;

      // Organizar os resíduos em grelha dentro da sua coluna
      // Máximo de 4 por linha, depois sobem
      const col = i % 4;
      const row = Math.floor(i / 4);

      const x = slotCenterX - 60 + col * 30;
      const y = baseY - row * 25;

      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      img.style.position = "fixed";

      // Prevenir seleção de imagem ao clicar com o rato
      img.addEventListener("dragstart", (e) => {
        e.preventDefault();
        return false;
      });

      container.appendChild(img);

      // Adicionar à lista de resíduos ativos
      residuosAtivos.push({
        elemento: img,
        tipo: tipo,
        ecoponto: config.ecoponto,
        x: x,
        y: y,
      });
    }
  });
}

/**
 * Inicializa o modo de desenvolvimento para testes com diferentes quantidades
 * Ativa-se premindo a tecla "D"
 */
function initDevMode() {
  const modal = document.getElementById("devModal");
  const applyBtn = document.getElementById("devApply");
  const closeBtn = document.getElementById("devClose");
  const clearStorageBtn = document.getElementById("devClearStorage");

  // Abrir o modal quando premimos a tecla D
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "d") {
      modal.classList.toggle("active");

      // Carregar os valores atuais nos campos
      if (modal.classList.contains("active")) {
        const quantidades = carregarQuantidadesResiduos();
        document.getElementById("papelQty").value = quantidades.papel;
        document.getElementById("vidroQty").value = quantidades.vidro;
        document.getElementById("plasticoQty").value = quantidades.plastico;
        document.getElementById("lixoQty").value = quantidades.lixo;
      }
    }
  });

  // Quando clicamos em Aplicar, guardar as novas quantidades
  applyBtn.addEventListener("click", () => {
    const papel = parseInt(document.getElementById("papelQty").value) || 0;
    const vidro = parseInt(document.getElementById("vidroQty").value) || 0;
    const plastico =
      parseInt(document.getElementById("plasticoQty").value) || 0;
    const lixo = parseInt(document.getElementById("lixoQty").value) || 0;

    localStorage.setItem("residuos_papel", papel);
    localStorage.setItem("residuos_vidro", vidro);
    localStorage.setItem("residuos_plastico", plastico);
    localStorage.setItem("residuos_lixo", lixo);

    renderizarResiduos(); // Recriar os resíduos com as novas quantidades
    modal.classList.remove("active");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  // Botão para limpar toda a configuração guardada
  clearStorageBtn.addEventListener("click", () => {
    if (
      confirm(
        "Tens a certeza que queres limpar todo o localStorage? Isto apagará todas as configurações guardadas."
      )
    ) {
      localStorage.clear();
      alert("localStorage limpo com sucesso!");
      modal.classList.remove("active");
      location.reload(); // Recarregar a página
    }
  });

  // Fechar o modal se clicarmos fora dele
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });
}

/**
 * Inicializa o modal de instruções baseado no modo de jogo selecionado
 */
function initInstrucoesModal() {
  // Determinar qual modal mostrar baseado no modo de jogo
  const modoDefinido = localStorage.getItem("modo_jogo");

  if (modoDefinido === "mouse") {
    // Modal para modo rato
    const modal = document.getElementById("instrucoesModalMouse");
    const jogarBtn = document.getElementById("instrucoesJogarMouse");
    const naoMostrarBtn = document.getElementById("instrucoesNaoMostrarMouse");

    // Verificar se o utilizador já pediu para não mostrar as instruções
    const naoMostrarInstrucoes = localStorage.getItem("nao_mostrar_instrucoes");

    // Mostrar o modal só se o utilizador não tiver desativado
    if (!naoMostrarInstrucoes || naoMostrarInstrucoes !== "true") {
      modal.classList.add("active");
    }

    // Botão para começar a jogar
    jogarBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });

    // Botão para não voltar a mostrar as instruções
    naoMostrarBtn.addEventListener("click", () => {
      localStorage.setItem("nao_mostrar_instrucoes", "true");
      modal.classList.remove("active");
    });

    // Fechar se clicarmos fora do modal
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  } else {
    // Modal para modo webcam
    const modal = document.getElementById("instrucoesModal");
    const jogarBtn = document.getElementById("instrucoesJogar");
    const naoMostrarBtn = document.getElementById("instrucoesNaoMostrar");

    // Verificar se o utilizador já pediu para não mostrar as instruções
    const naoMostrarInstrucoes = localStorage.getItem("nao_mostrar_instrucoes");

    // Mostrar o modal só se o utilizador não tiver desativado
    if (!naoMostrarInstrucoes || naoMostrarInstrucoes !== "true") {
      modal.classList.add("active");
    }

    // Botão para começar a jogar
    jogarBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });

    // Botão para não voltar a mostrar as instruções
    naoMostrarBtn.addEventListener("click", () => {
      localStorage.setItem("nao_mostrar_instrucoes", "true");
      modal.classList.remove("active");
    });

    // Fechar se clicarmos fora do modal
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
}

/**
 * Apresenta o modal de fim de jogo com a pontuação final
 */
function mostrarModalFimJogo() {
  const modal = document.getElementById("fimJogoModal");
  const pontuacaoFinalValor = document.getElementById("pontuacaoFinalValor");

  pontuacaoFinalValor.textContent = pontuacao;
  modal.classList.add("active");
}

/**
 * Configura os eventos do modal de fim de jogo
 */
function initFimJogoModal() {
  const modal = document.getElementById("fimJogoModal");
  const voltarInicioBtn = document.getElementById("voltarInicio");

  voltarInicioBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
  });
}

// Quando a página carrega, inicializar tudo
window.addEventListener("DOMContentLoaded", () => {
  setup(); // Configurar webcam e deteção de mãos
  initDevMode(); // Ativar o modo de programador
  initInstrucoesModal(); // Preparar o modal de instruções
  initFimJogoModal(); // Preparar o modal de fim de jogo
  renderizarResiduos(); // Criar os resíduos no ecrã
});
