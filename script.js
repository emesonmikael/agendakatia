// URL do seu Google Apps Script
const SCRIPT_URL = process.env.REACT_APP_API_URL;

// ----------- AGENDAR -------------
function enviarAgendamento() {
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const data = document.getElementById("data").value;
  const hora = document.getElementById("hora").value;

  if (!nome || !telefone || !data || !hora) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, telefone, data, hora })
  })
  .then(r => r.json())
  .then(res => {
    if (res.status === "OK") {
      alert("✅ Agendamento feito com sucesso!");
      document.getElementById("nome").value = "";
      document.getElementById("telefone").value = "";
      carregarAgendamentos();
    } else {
      alert("❌ Erro ao agendar: " + res.message);
    }
  })
  .catch(err => alert("Erro: " + err.message));
}

// ----------- LISTAR CLIENTE -------------
function carregarAgendamentos() {
  fetch(SCRIPT_URL)
    .then(r => r.json())
    .then(agendamentos => {
      const lista = document.getElementById("lista-agendamentos");
      lista.innerHTML = "";
      agendamentos.forEach(a => {
        const li = document.createElement("li");
        li.textContent = `${a.data} - ${a.hora} → ${a.nome}`;
        lista.appendChild(li);
      });
    });
}

// ----------- ADMIN PAINEL -------------
document.getElementById("abrir-admin").onclick = () => {
  const senha = prompt("Digite a senha de administradora:");
  if (senha === "katia123") { // pode trocar depois
    document.getElementById("area-cliente").style.display = "none";
    document.getElementById("area-admin").style.display = "block";
    carregarAdmin();
  } else {
    alert("Senha incorreta!");
  }
};

function sairAdmin() {
  document.getElementById("area-admin").style.display = "none";
  document.getElementById("area-cliente").style.display = "block";
}

function carregarAdmin() {
  fetch(SCRIPT_URL)
    .then(r => r.json())
    .then(agendamentos => {
      const lista = document.getElementById("lista-admin");
      lista.innerHTML = "";
      agendamentos.forEach(a => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${a.nome}</strong> - ${a.data} às ${a.hora}
          <br>
          <a class="whatsapp" href="https://wa.me/55${a.telefone.replace(/\D/g,'')}" target="_blank">
            Confirmar no WhatsApp
          </a>
        `;
        lista.appendChild(li);
      });
    });
}

// Carregar agendamentos ao abrir
carregarAgendamentos();
