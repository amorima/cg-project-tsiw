// Função para gerenciar a música de fundo
function setupAudio() {
  // Garante que o código só é executado no browser
  if (typeof window === "undefined") {
    return;
  }

  // Cria um único elemento de áudio para toda a aplicação
  if (!window.audioElement) {
    // Usar um caminho absoluto a partir da raiz do site
    window.audioElement = new Audio("/assets/sound/arcade.mp3");
    window.audioElement.loop = true;
  }

  const audio = window.audioElement;

  // Carrega o estado do áudio do localStorage
  const isMuted = localStorage.getItem("isMuted") === "true";
  const musicTime = parseFloat(localStorage.getItem("musicTime")) || 0;

  audio.muted = isMuted;

  // Define o tempo da música apenas se for um número válido
  if (!isNaN(musicTime)) {
    audio.currentTime = musicTime;
  }

  // Tenta tocar a música
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      // Adiciona um ouvinte de eventos para tocar a música na primeira interação do utilizador
      const playOnClick = () => {
        audio.play();
        document.body.removeEventListener("click", playOnClick);
      };
      document.body.addEventListener("click", playOnClick);
    });
  }

  // Guarda o estado do áudio antes de a página ser descarregada
  window.addEventListener("beforeunload", () => {
    localStorage.setItem("isMuted", String(audio.muted));
    localStorage.setItem("musicTime", String(audio.currentTime));
  });
}

// Função para alternar o mute, a ser chamada pela página de configurações
function toggleMute() {
  if (window.audioElement) {
    window.audioElement.muted = !window.audioElement.muted;
    localStorage.setItem("isMuted", String(window.audioElement.muted));
    // Atualiza o texto do botão
    const muteButton = document.getElementById("muteButton");
    if (muteButton) {
      muteButton.textContent = window.audioElement.muted
        ? "Ativar Som"
        : "Desativar Som";
    }
  }
}

// Executa a função quando o DOM estiver completamente carregado
document.addEventListener("DOMContentLoaded", () => {
  setupAudio();
});
