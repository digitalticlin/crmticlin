const cleanup = require("./cleanup-orphan-instances.js");
const instance = new cleanup();

instance.deleteOrphans(false)
  .then(result => {
    console.log("✅ Limpeza concluída com sucesso!");
  })
  .catch(error => {
    console.error("❌ Erro na limpeza:", error.message);
  }); 