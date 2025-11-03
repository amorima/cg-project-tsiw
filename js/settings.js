// settings.js

document.addEventListener("DOMContentLoaded", () => {
  const muteButton = document.getElementById("muteButton");
  const clearDataButton = document.getElementById("clearDataButton");
  const quickTestButton = document.getElementById("quickTestButton");
  const clearDataModal = document.getElementById("clearDataModal");
  const confirmClearBtn = document.getElementById("confirmClearBtn");
  const cancelClearBtn = document.getElementById("cancelClearBtn");

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

  // Função para limpar os dados do localStorage
  if (clearDataButton) {
    clearDataButton.addEventListener("click", () => {
      // Mostra o modal de confirmação
      clearDataModal.classList.add("show");
    });
  }

  // Botão para confirmar limpeza de dados
  if (confirmClearBtn) {
    confirmClearBtn.addEventListener("click", () => {
      // Limpa todo o localStorage
      localStorage.clear();
      clearDataModal.classList.remove("show");
      alert("Dados limpados com sucesso! A página será recarregada.");
      // Recarrega a página
      location.reload();
    });
  }

  // Botão para cancelar limpeza de dados
  if (cancelClearBtn) {
    cancelClearBtn.addEventListener("click", () => {
      // Apenas fecha o modal
      clearDataModal.classList.remove("show");
    });
  }

  // Fechar modal ao clicar fora dele
  if (clearDataModal) {
    clearDataModal.addEventListener("click", (e) => {
      if (e.target === clearDataModal) {
        clearDataModal.classList.remove("show");
      }
    });
  }

  // Função para gerar valores aleatórios entre 1 e 5
  function gerarQuantidadeAleatoria() {
    return Math.floor(Math.random() * 5) + 1;
  }

  // Botão para ir para a segunda fase com dados de teste
  if (quickTestButton) {
    quickTestButton.addEventListener("click", () => {
      // Gera valores aleatórios para cada tipo de resíduo
      localStorage.setItem("residuos_papel", gerarQuantidadeAleatoria());
      localStorage.setItem("residuos_vidro", gerarQuantidadeAleatoria());
      localStorage.setItem("residuos_plastico", gerarQuantidadeAleatoria());
      localStorage.setItem("residuos_lixo", gerarQuantidadeAleatoria());

      // Navega para a segunda fase
      window.location.href = "../html/jogo_ml5.html";
    });
  }
});
