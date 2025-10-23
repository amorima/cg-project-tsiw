// Função para carregar e processar o README do GitHub
async function loadCredits() {
  try {
    // Buscar o README do repositório
    const response = await fetch(
      "https://raw.githubusercontent.com/amorima/cg-project-tsiw/main/README.md"
    );

    if (!response.ok) {
      throw new Error("Falha ao carregar o README");
    }

    const markdown = await response.text();

    // Processar o markdown e converter para HTML
    const htmlContent = processMarkdown(markdown);

    // Atualizar o contentor de créditos
    const creditsContainer = document.getElementById("creditsContainer");
    creditsContainer.innerHTML = "<h1>CRÉDITOS</h1>" + htmlContent;
  } catch (error) {
    console.error("Erro ao carregar créditos:", error);
    const creditsContainer = document.getElementById("creditsContainer");
    creditsContainer.innerHTML =
      '<h1>CRÉDITOS</h1><p style="color: #ff6b6b;">Erro ao carregar conteúdo. Tente novamente mais tarde.</p>';
  }
}

// Função para converter markdown básico para HTML
function processMarkdown(markdown) {
  let html = markdown;

  // Remover o título principal (#)
  html = html.replace(/^# ARCADIA\n/gm, "");

  // Converter títulos de secção (## para h2)
  html = html.replace(
    /^## (.+)$/gm,
    '<section class="credits-section"><h2>$1</h2>'
  );

  // Fechar as secções antes de um novo título ou fim
  html = html.replace(
    /<section class="credits-section"><h2>/g,
    '</section><section class="credits-section"><h2>'
  );
  html = html + "</section>";

  // Remover secções vazias
  html = html.replace(
    /<\/section><section class="credits-section"><\/section>/g,
    ""
  );

  // Converter parágrafos (linhas que não são listas, títulos, etc.)
  html = html
    .split("\n")
    .map((line) => {
      // Skip linhas vazias, listas e já processadas
      if (
        !line.trim() ||
        line.startsWith("-") ||
        line.startsWith("*") ||
        line.startsWith("<")
      ) {
        return line;
      }
      // Skip linhas que já são HTML
      if (line.includes("<")) {
        return line;
      }
      // Converter para parágrafo se não estiver vazio
      if (line.trim() && !line.startsWith("#")) {
        return "<p>" + line.trim() + "</p>";
      }
      return line;
    })
    .join("\n");

  // Converter listas não ordenadas
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.+<\/li>\n?)+/g, (match) => {
    return "<ul>\n" + match + "</ul>\n";
  });

  // Converter listas ordenadas (números)
  html = html.replace(/^\s*(\d+)\.\s+(.+)$/gm, "<li>$2</li>");

  // Converter negrito
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Remover múltiplas quebras de linha
  html = html.replace(/\n\n+/g, "\n");

  // Limpar seções vazias finais
  html = html.replace(/<section class="credits-section"><\/section>/g, "");

  return html;
}

// Adicionar secção de instituição no final
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

// Carregar créditos quando a página está pronta
document.addEventListener("DOMContentLoaded", () => {
  loadCredits();
  // Tentar atualizar a cada 5 minutos (300000ms)
  setInterval(loadCredits, 300000);
});
