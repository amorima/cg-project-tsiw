let video;
let handDetector;
let canvas;
let ctx;
let hands = [];

const RESIDUOS_CONFIG = {
  papel: {
    img: "../assets/img/residuos/papel.png",
    ecoponto: "azul",
  },
  vidro: {
    img: "../assets/img/residuos/vidro.png",
    ecoponto: "verde",
  },
  plastico: {
    img: "../assets/img/residuos/plástico.png",
    ecoponto: "amarelo",
  },
  lixo: {
    img: "../assets/img/residuos/lixo.png",
    ecoponto: "cinzento",
  },
};

let residuosAtivos = [];
let residuoSelecionado = null;
let residuoAgarrado = null;
let ecopontoSelecionado = null;
let pontuacao = 0;
let posicaoOriginal = null;

async function setup() {
  video = document.getElementById("videoCanvas");
  canvas = document.getElementById("handCanvas");
  ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  try {
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", async () => {
      video.play();
      await initHandDetection();
      detectHands();
    });
  } catch (error) {
    console.error("Erro ao aceder à webcam:", error);
  }
}

async function initHandDetection() {
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: "mediapipe",
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
    maxHands: 2,
    modelType: "full",
  };

  handDetector = await handPoseDetection.createDetector(model, detectorConfig);
  console.log("Detetor de mãos inicializado");
}

async function detectHands() {
  if (handDetector && video.readyState === 4) {
    hands = await handDetector.estimateHands(video);
    drawHands();
  }

  requestAnimationFrame(detectHands);
}

function drawHands() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (hands.length > 0) {
    hands.forEach((hand) => {
      const keypoints = hand.keypoints;

      const indicadorPonta = keypoints[8];
      const indicadorX =
        canvas.width - (indicadorPonta.x / video.videoWidth) * canvas.width;
      const indicadorY = (indicadorPonta.y / video.videoHeight) * canvas.height;

      const dedosJuntos = verificarDedosJuntos(keypoints);

      keypoints.forEach((point, index) => {
        const x = canvas.width - (point.x / video.videoWidth) * canvas.width;
        const y = (point.y / video.videoHeight) * canvas.height;
        const z = point.z || 0;

        const size = 8 + z * 0.5;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${120 + z * 10}, 80%, 60%)`;
        ctx.fill();
        ctx.strokeStyle = "#4a9d4a";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (index === 8) {
          ctx.font = "14px Arial";
          ctx.fillStyle = "#a8d5a8";
          ctx.fillText(`z: ${z.toFixed(2)}`, x + 10, y - 10);

          if (residuoAgarrado) {
            moverResiduoAgarrado(x, y);
            verificarColisaoEcopontos(x, y);

            if (!dedosJuntos) {
              largarResiduo(x, y);
            }
          }
        }
      });

      drawConnections(keypoints);

      if (!residuoAgarrado) {
        verificarColisaoResiduos(indicadorX, indicadorY);

        if (dedosJuntos && residuoSelecionado) {
          agarrarResiduo();
        }
      }
    });
  } else {
    limparSelecao();
    limparEcopontoSelecionado();
  }
}

function drawConnections(keypoints) {
  const connections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16],
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20],
    [5, 9],
    [9, 13],
    [13, 17],
  ];

  ctx.strokeStyle = "#4a9d4a";
  ctx.lineWidth = 2;

  connections.forEach(([start, end]) => {
    const startPoint = keypoints[start];
    const endPoint = keypoints[end];

    const x1 = canvas.width - (startPoint.x / video.videoWidth) * canvas.width;
    const y1 = (startPoint.y / video.videoHeight) * canvas.height;
    const x2 = canvas.width - (endPoint.x / video.videoWidth) * canvas.width;
    const y2 = (endPoint.y / video.videoHeight) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}

function verificarColisaoResiduos(handX, handY) {
  let residuoMaisProximo = null;
  let menorDistancia = Infinity;

  residuosAtivos.forEach((residuo) => {
    if (residuo.elemento.classList.contains("grabbed")) return;

    const rect = residuo.elemento.getBoundingClientRect();
    const residuoX = rect.left + rect.width / 2;
    const residuoY = rect.top + rect.height / 2;

    const distancia = Math.sqrt(
      Math.pow(handX - residuoX, 2) + Math.pow(handY - residuoY, 2)
    );

    const raioColisao = 80;

    if (distancia < raioColisao && distancia < menorDistancia) {
      menorDistancia = distancia;
      residuoMaisProximo = residuo;
    }
  });

  if (residuoMaisProximo !== residuoSelecionado) {
    limparSelecao();

    if (residuoMaisProximo) {
      residuoMaisProximo.elemento.classList.add("highlighted");
      residuoSelecionado = residuoMaisProximo;
    }
  }
}

function verificarDedosJuntos(keypoints) {
  const polegar = keypoints[4];
  const indicador = keypoints[8];
  const medio = keypoints[12];
  const anelar = keypoints[16];
  const mindinho = keypoints[20];

  const pontas = [indicador, medio, anelar, mindinho];

  let todasProximas = true;
  pontas.forEach((ponta) => {
    const distancia = Math.sqrt(
      Math.pow(polegar.x - ponta.x, 2) + Math.pow(polegar.y - ponta.y, 2)
    );

    if (distancia > 80) {
      todasProximas = false;
    }
  });

  return todasProximas;
}

function agarrarResiduo() {
  if (!residuoSelecionado) return;

  residuoAgarrado = residuoSelecionado;
  residuoAgarrado.elemento.classList.remove("highlighted");
  residuoAgarrado.elemento.classList.add("grabbed");

  posicaoOriginal = {
    left: residuoAgarrado.elemento.style.left,
    bottom: residuoAgarrado.elemento.style.bottom,
    top: residuoAgarrado.elemento.style.top,
    position: residuoAgarrado.elemento.style.position || "absolute",
  };

  residuoAgarrado.elemento.style.position = "fixed";
  residuoSelecionado = null;
}

function moverResiduoAgarrado(handX, handY) {
  if (!residuoAgarrado) return;

  const elemento = residuoAgarrado.elemento;
  const canvasRect = canvas.getBoundingClientRect();

  elemento.style.left = `${canvasRect.left + handX}px`;
  elemento.style.top = `${canvasRect.top + handY}px`;
  elemento.style.bottom = "auto";
  elemento.style.transform = "translate(-50%, -50%)";
}

function verificarColisaoEcopontos(handX, handY) {
  const ecopontos = document.querySelectorAll(".ecoponto");
  let ecopontoMaisProximo = null;
  let menorDistancia = Infinity;

  ecopontos.forEach((ecoponto) => {
    const rect = ecoponto.getBoundingClientRect();
    const ecopontoX = rect.left + rect.width / 2;
    const ecopontoY = rect.top + rect.height / 2;

    const distancia = Math.sqrt(
      Math.pow(handX - ecopontoX, 2) + Math.pow(handY - ecopontoY, 2)
    );

    const raioColisao = 150;

    if (distancia < raioColisao && distancia < menorDistancia) {
      menorDistancia = distancia;
      ecopontoMaisProximo = {
        elemento: ecoponto,
        tipo: ecoponto.dataset.type,
      };
    }
  });

  if (ecopontoMaisProximo !== ecopontoSelecionado) {
    limparEcopontoSelecionado();

    if (ecopontoMaisProximo) {
      ecopontoMaisProximo.elemento.classList.add("highlighted");
      ecopontoSelecionado = ecopontoMaisProximo;
    }
  }
}

function largarResiduo(handX, handY) {
  if (!residuoAgarrado) return;

  const residuo = residuoAgarrado;

  if (ecopontoSelecionado) {
    const ecopontoCerto = residuo.ecoponto === ecopontoSelecionado.tipo;

    residuo.elemento.classList.remove("grabbed");
    residuo.elemento.classList.add("fadeout");

    const ecopontoRect = ecopontoSelecionado.elemento.getBoundingClientRect();
    const targetX = ecopontoRect.left + ecopontoRect.width / 2;
    const targetY = ecopontoRect.top + ecopontoRect.height;

    residuo.elemento.style.position = "absolute";
    residuo.elemento.style.transition =
      "left 0.3s ease, top 0.3s ease, opacity 0.5s ease, transform 0.5s ease";
    residuo.elemento.style.left = `${targetX}px`;
    residuo.elemento.style.top = `${targetY}px`;

    if (ecopontoCerto) {
      adicionarPontos(5);
    } else {
      adicionarPontos(-10);
    }

    setTimeout(() => {
      residuo.elemento.remove();
      residuosAtivos = residuosAtivos.filter((r) => r !== residuo);
    }, 500);

    residuoAgarrado = null;
    posicaoOriginal = null;
    limparEcopontoSelecionado();
  } else {
    residuo.elemento.classList.remove("grabbed");

    if (posicaoOriginal) {
      residuo.elemento.style.position = "absolute";
      residuo.elemento.style.transition = "left 0.3s ease, top 0.3s ease";
      residuo.elemento.style.left = posicaoOriginal.left;
      residuo.elemento.style.top = posicaoOriginal.top || "auto";
      residuo.elemento.style.bottom = posicaoOriginal.bottom;

      setTimeout(() => {
        residuo.elemento.style.transition = "";
      }, 300);
    }

    residuoAgarrado = null;
    posicaoOriginal = null;
  }
}

function adicionarPontos(pontos) {
  pontuacao += pontos;
  const pontuacaoElemento = document.querySelector("#pontuacao .pontos");
  pontuacaoElemento.textContent = pontuacao;

  if (pontos > 0) {
    pontuacaoElemento.style.color = "#6bc56b";
  } else {
    pontuacaoElemento.style.color = "#ff4444";
    setTimeout(() => {
      pontuacaoElemento.style.color = "#6bc56b";
    }, 500);
  }
}

function limparSelecao() {
  if (residuoSelecionado) {
    residuoSelecionado.elemento.classList.remove("highlighted");
    residuoSelecionado = null;
  }
}

function limparEcopontoSelecionado() {
  if (ecopontoSelecionado) {
    ecopontoSelecionado.elemento.classList.remove("highlighted");
    ecopontoSelecionado = null;
  }
}

function carregarQuantidadesResiduos() {
  const quantidades = {
    papel: parseInt(localStorage.getItem("residuos_papel")) || 0,
    vidro: parseInt(localStorage.getItem("residuos_vidro")) || 0,
    plastico: parseInt(localStorage.getItem("residuos_plastico")) || 0,
    lixo: parseInt(localStorage.getItem("residuos_lixo")) || 0,
  };

  return quantidades;
}

function renderizarResiduos() {
  const container = document.getElementById("residuosContainer");
  container.innerHTML = "";
  residuosAtivos = [];

  const quantidades = carregarQuantidadesResiduos();
  const containerHeight = window.innerHeight / 3;
  const containerWidth = window.innerWidth;

  const numSlots = 4;
  const slotWidth = containerWidth / numSlots;

  const tipos = ["papel", "vidro", "plastico", "lixo"];
  const tiposAleatorios = [...tipos].sort(() => Math.random() - 0.5);

  tiposAleatorios.forEach((tipo, slotIndex) => {
    const quantidade = quantidades[tipo];
    const config = RESIDUOS_CONFIG[tipo];

    const slotCenterX = slotIndex * slotWidth + slotWidth / 2;

    for (let i = 0; i < quantidade; i++) {
      const img = document.createElement("img");
      img.src = config.img;
      img.className = "residuo";
      img.dataset.tipo = tipo;
      img.dataset.ecoponto = config.ecoponto;

      const baseY = containerHeight - 100;

      const col = i % 4;
      const row = Math.floor(i / 4);

      const x = slotCenterX - 60 + col * 30;
      const y = baseY - row * 25;

      img.style.left = `${x}px`;
      img.style.bottom = `${containerHeight - y}px`;

      container.appendChild(img);

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

function initDevMode() {
  const modal = document.getElementById("devModal");
  const applyBtn = document.getElementById("devApply");
  const closeBtn = document.getElementById("devClose");
  const clearStorageBtn = document.getElementById("devClearStorage");

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "d") {
      modal.classList.toggle("active");

      if (modal.classList.contains("active")) {
        const quantidades = carregarQuantidadesResiduos();
        document.getElementById("papelQty").value = quantidades.papel;
        document.getElementById("vidroQty").value = quantidades.vidro;
        document.getElementById("plasticoQty").value = quantidades.plastico;
        document.getElementById("lixoQty").value = quantidades.lixo;
      }
    }
  });

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

    renderizarResiduos();
    modal.classList.remove("active");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  clearStorageBtn.addEventListener("click", () => {
    if (
      confirm(
        "Tens a certeza que queres limpar todo o localStorage? Isto apagará todas as configurações guardadas."
      )
    ) {
      localStorage.clear();
      alert("localStorage limpo com sucesso!");
      modal.classList.remove("active");
      location.reload();
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });
}

function initInstrucoesModal() {
  const modal = document.getElementById("instrucoesModal");
  const jogarBtn = document.getElementById("instrucoesJogar");
  const naoMostrarBtn = document.getElementById("instrucoesNaoMostrar");

  const naoMostrarInstrucoes = localStorage.getItem("nao_mostrar_instrucoes");

  if (!naoMostrarInstrucoes || naoMostrarInstrucoes !== "true") {
    modal.classList.add("active");
  }

  jogarBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  naoMostrarBtn.addEventListener("click", () => {
    localStorage.setItem("nao_mostrar_instrucoes", "true");
    modal.classList.remove("active");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setup();
  initDevMode();
  initInstrucoesModal();
  renderizarResiduos();
});
