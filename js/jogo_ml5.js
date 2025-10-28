let video;
let classifier;

async function setup() {
  video = document.getElementById("videoCanvas");

  try {
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
  } catch (error) {
    console.error("Erro ao aceder à webcam:", error);
  }
}

window.addEventListener("DOMContentLoaded", setup);
