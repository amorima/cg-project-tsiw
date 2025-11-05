// Função para ir buscar e processar o ficheiro README do repositório GitHub
async function loadCredits() {
  try {
    // Fazer um pedido para obter o README.md do repositório
    // Usamos o raw.githubusercontent.com porque dá-nos o ficheiro em texto puro
    const response = await fetch(
      "https://raw.githubusercontent.com/amorima/cg-project-tsiw/main/README.md"
    );

    if (!response.ok) {
      throw new Error("Falha ao carregar o README");
    }

    const markdown = await response.text();

    // Converter o markdown para HTML para mostrar na página
    const htmlContent = processMarkdown(markdown);

    // Colocar o conteúdo no contentor de créditos
    const creditsContainer = document.getElementById("creditsContainer");
    creditsContainer.innerHTML = "<h1>CRÉDITOS</h1>" + htmlContent;
  } catch (error) {
    console.error("Erro ao carregar créditos:", error);
    // Se houver erro, mostrar uma mensagem ao utilizador
    const creditsContainer = document.getElementById("creditsContainer");
    creditsContainer.innerHTML =
      '<h1>CRÉDITOS</h1><p style="color: #ff6b6b;">Erro ao carregar conteúdo. Tente novamente mais tarde.</p>';
  }
}

// Função que converte markdown básico para HTML
// Não usei uma biblioteca externa para manter o projeto mais simples
function processMarkdown(markdown) {
  let html = markdown;

  // Remover o título principal (# ARCADIA) porque já temos um no HTML
  html = html.replace(/^# ARCADIA\n/gm, "");

  // Converter títulos de nível 3 (###) em elementos h3
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");

  // Converter títulos de secção (##) em elementos h2 dentro de secções
  html = html.replace(
    /^## (.+)$/gm,
    '<section class="credits-section"><h2>$1</h2>'
  );

  // Fechar as secções antes de um novo título ou no fim
  html = html.replace(
    /<section class="credits-section"><h2>/g,
    '</section><section class="credits-section"><h2>'
  );
  html = html + "</section>";

  // Remover secções vazias que possam ter ficado
  html = html.replace(
    /<\/section><section class="credits-section"><\/section>/g,
    ""
  );

  // Converter parágrafos normais em elementos <p>
  html = html
    .split("\n")
    .map((line) => {
      // Saltar linhas vazias, listas e linhas que já têm HTML
      if (
        !line.trim() ||
        line.startsWith("-") ||
        line.startsWith("*") ||
        line.startsWith("<")
      ) {
        return line;
      }
      // Não processar se já for HTML
      if (line.includes("<")) {
        return line;
      }
      // Converter para parágrafo se for texto normal
      if (line.trim() && !line.startsWith("#")) {
        return "<p>" + line.trim() + "</p>";
      }
      return line;
    })
    .join("\n");

  // Converter listas não ordenadas (linhas que começam com - ou *)
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.+<\/li>\n?)+/g, (match) => {
    return "<ul>\n" + match + "</ul>\n";
  });

  // Converter listas ordenadas (linhas que começam com números)
  html = html.replace(/^\s*(\d+)\.\s+(.+)$/gm, "<li>$2</li>");

  // Converter texto em negrito (**texto** ou __texto__)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Remover quebras de linha múltiplas
  html = html.replace(/\n\n+/g, "\n");

  // Limpar secções vazias que possam ter sobrado
  html = html.replace(/<section class="credits-section"><\/section>/g, "");

  return html;
}

// Adicionar uma secção extra com informação da instituição
// Adicionar uma secção extra com informação da instituição
function addInstitutionSection() {
  const creditsContainer = document.getElementById("creditsContainer");
  const institutionSection = document.createElement("section");
  institutionSection.className = "credits-section institution";
  institutionSection.innerHTML = `
    <p><strong>ESMAD - Escola Superior de Media, Artes e Design</strong></p>
    <p><strong>Instituto Politécnico do Porto</strong></p>
  `;
  creditsContainer.appendChild(institutionSection);
}

// Carregar os créditos quando a página fica pronta
document.addEventListener("DOMContentLoaded", () => {
  loadCredits();
  // Tentar atualizar de 5 em 5 minutos caso o README seja alterado
  // Isto é útil durante o desenvolvimento do projeto
  setInterval(loadCredits, 300000); // 300000ms = 5 minutos
});
