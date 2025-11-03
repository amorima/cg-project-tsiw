// settings.js

document.addEventListener("DOMContentLoaded", () => {
  const muteButton = document.getElementById("muteButton");

  // Garante que o botão existe antes de adicionar o ouvinte de eventos
  if (muteButton) {
    // Define o texto inicial do botão com base no estado do áudio
    // Acessa o audioElement global criado em main.js
    if (window.audioElement) {
      muteButton.textContent = window.audioElement.muted
        ? "Ativar Som"
        : "Desativar Som";
    }

    // Adiciona um ouvinte de eventos para o clique no botão
    muteButton.addEventListener("click", () => {
      // A função toggleMute está definida em main.js
      if (typeof toggleMute === "function") {
        toggleMute();
      }
    });
  }
});
