
// deno-lint-ignore-file no-explicit-any
export async function forwardToN8N(n8nWebhookUrl: string, payload: any): Promise<void> {
  if (!n8nWebhookUrl) return;

  console.log(`Encaminhando payload para N8N: ${n8nWebhookUrl}`);
  // Não aguardar a resposta do N8N para não atrasar a resposta ao Evolution API
  fetch(n8nWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), // Envia o payload original recebido
  })
  .then(response => {
    if (!response.ok) {
      response.text().then(text => {
        console.error(`Erro ao encaminhar para N8N (${response.status}): ${text}`);
      });
    } else {
      console.log("Payload encaminhado para N8N com sucesso.");
    }
  })
  .catch(err => {
    console.error("Erro de rede ao tentar encaminhar para N8N:", err);
  });
}
