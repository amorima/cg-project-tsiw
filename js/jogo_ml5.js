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

      keypoints.forEach((point, index) => {
        const x = canvas.width - (point.x / 1280) * canvas.width;
        const y = (point.y / 720) * canvas.height;
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
        }
      });

      drawConnections(keypoints);
    });
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

    const x1 = canvas.width - (startPoint.x / 1280) * canvas.width;
    const y1 = (startPoint.y / 720) * canvas.height;
    const x2 = canvas.width - (endPoint.x / 1280) * canvas.width;
    const y2 = (endPoint.y / 720) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
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

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setup();
  initDevMode();
  renderizarResiduos();
});
