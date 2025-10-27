// script.js - versão corrigida e unificada
const API_BASE = "https://serveragenda.vercel.app"; // ajuste se for outro host

/* ----------------- CLIENT (index.html) ----------------- */
const dataInput = document.getElementById("dataAgendamento");
const slotsContainer = document.getElementById("slotsContainer");
const formContainer = document.getElementById("formContainer");
const mensagemDiv = document.getElementById("mensagem");

let horarioSelecionado = null;
let dataSelecionada = null;

if (dataInput) {
  // define mínimo de data (hoje)
  const hoje = new Date();
  const dd = String(hoje.getDate()).padStart(2, '0');
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const yyyy = hoje.getFullYear();
  dataInput.min = `${yyyy}-${mm}-${dd}`;

  dataInput.addEventListener("change", async () => {
    dataSelecionada = dataInput.value;
    horarioSelecionado = null;
    if (formContainer) formContainer.style.display = "none";
    if (mensagemDiv) mensagemDiv.textContent = "";
    await carregarHorarios();
  });
}

/**
 * carregarHorarios - busca do backend e renderiza slots
 */
async function carregarHorarios() {
  if (!dataSelecionada) {
    if (slotsContainer) slotsContainer.innerHTML = "<p>Escolha uma data.</p>";
    return;
  }

  if (slotsContainer) slotsContainer.innerHTML = "<p>Carregando horários...</p>";
  try {
    const res = await fetch(`${API_BASE}/horarios?date=${dataSelecionada}`);
    if (!res.ok) throw new Error('Erro no servidor');
    const data = await res.json();

    if (!data.slots || data.slots.length === 0) {
      slotsContainer.innerHTML = "<p>Nenhum horário disponível para esta data.</p>";
      return;
    }

    slotsContainer.innerHTML = "";
    data.slots.forEach(slot => {
      const div = document.createElement("div");
      div.className = "slot" + (slot.available ? "" : " unavailable");
      div.textContent = slot.time + (slot.available ? "" : " (ocupado)");
      if (slot.available) {
        div.style.cursor = "pointer";
        div.addEventListener("click", () => selecionarHorario(slot.time));
      }
      slotsContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    if (slotsContainer) slotsContainer.innerHTML = "<p>Erro ao carregar horários.</p>";
  }
}
window.carregarHorarios = carregarHorarios; // exposto globalmente

function selecionarHorario(hora) {
  horarioSelecionado = hora;
  if (formContainer) formContainer.style.display = "block";
  if (mensagemDiv) mensagemDiv.textContent = "";
}

/* confirmar agendamento no cliente */
const confirmarBtn = document.getElementById("confirmarBtn");
if (confirmarBtn) {
  confirmarBtn.addEventListener("click", async () => {
    const nome = document.getElementById("nomeCliente").value.trim();
    const telefone = document.getElementById("telefoneCliente").value.trim();
    const servico = document.getElementById("servicoCliente").value.trim() || 'Serviço';

    if (!nome || !telefone || !dataSelecionada || !horarioSelecionado) {
      mensagemDiv.textContent = "Preencha todos os campos e selecione um horário.";
      return;
    }

    const body = { nome, telefone, servico, data: dataSelecionada, hora: horarioSelecionado, autoConfirm: true };

    try {
      const res = await fetch(`${API_BASE}/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (result.ok) {
        mensagemDiv.textContent = "Agendamento confirmado! ✅";
        formContainer.style.display = "none";
        await carregarHorarios();
      } else {
        mensagemDiv.textContent = "Erro: " + (result.error || "não foi possível agendar");
      }
    } catch (err) {
      console.error(err);
      mensagemDiv.textContent = "Erro de conexão com o servidor.";
    }
  });
}

/* ----------------- ADMIN (admin.html) ----------------- */

let adminPass = ""; // preenchido no loginAdmin()

/**
 * loginAdmin - chama ao clicar em Entrar no admin.html
 * (exibe a área admin e carrega config inicial)
 */
async function loginAdmin() {
  const passInput = document.getElementById("adminPassword");
  if (!passInput) return alert('Campo de senha não encontrado.');
  adminPass = passInput.value.trim();
  if (!adminPass) return alert('Digite a senha.');

  try {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Não foi possível obter config');
    const cfg = await res.json();

    document.getElementById("startTime").value = cfg.startTime || "07:00";
    document.getElementById("endTime").value = cfg.endTime || "16:00";
    document.getElementById("duration").value = cfg.defaultDuration || 60;
    document.getElementById("daysOfWeek").value = (cfg.daysOfWeek || []).join(",");

    document.getElementById("adminArea").style.display = "block";
    // opcional: esconder o bloco de login
    // document.querySelector('.card input#adminPassword').closest('.card').style.display = 'none';
    await carregarAgendamentos();
  } catch (err) {
    console.error(err);
    alert('Erro ao logar ou carregar configurações.');
  }
}
window.loginAdmin = loginAdmin;

async function salvarConfig() {
  const cfg = {
    startTime: document.getElementById("startTime").value,
    endTime: document.getElementById("endTime").value,
    defaultDuration: parseInt(document.getElementById("duration").value, 10),
    daysOfWeek: document.getElementById("daysOfWeek").value.split(",").map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n))
  };
  try {
    const res = await fetch(`${API_BASE}/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPass
      },
      body: JSON.stringify(cfg)
    });
    const data = await res.json();
    if (data.ok) {
      alert('Configurações salvas com sucesso!');
      // atualizar possível: se o admin estiver no index.html aberto em outra aba, ele precisará recarregar
    } else {
      alert('Erro ao salvar config: ' + (data.error||JSON.stringify(data)));
    }
  } catch (err) {
    console.error(err);
    alert('Erro na requisição ao salvar config.');
  }
}
window.salvarConfig = salvarConfig;

/* carregarAgendamentos - exibe todos os bookings (admin view) */
async function carregarAgendamentos() {
  try {
    const res = await fetch(`${API_BASE}/agendamentos`, {
      headers: { "x-admin-password": adminPass }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error('Erro ao carregar agendamentos: ' + text);
    }
    const data = await res.json();
    const listaDiv = document.getElementById("listaAgendamentos");
    if (!listaDiv) return;
    if (!Array.isArray(data) || data.length === 0) {
      listaDiv.innerHTML = "<p>Nenhum agendamento encontrado.</p>";
      return;
    }

    // agrupa por data
    const grouped = {};
    data.forEach(b => {
      if (!grouped[b.data]) grouped[b.data] = [];
      grouped[b.data].push(b);
    });

    listaDiv.innerHTML = "";
    Object.keys(grouped).sort().forEach(dateStr => {
      const section = document.createElement("div");
      const h3 = document.createElement("h3");
      h3.textContent = dateStr;
      section.appendChild(h3);

      grouped[dateStr].sort((a,b) => a.hora.localeCompare(b.hora)).forEach(b => {
        const div = document.createElement("div");
        div.className = "slot";
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.style.marginBottom = "8px";
        div.innerHTML = `
          <div><strong>${b.hora}</strong> - ${b.nome} (${b.telefone || '—'})</div>
          <div>Serviço: ${b.servico || '-'}</div>
          <div>Status: <b>${b.status}</b></div>
         
        `;

        const actions = document.createElement("div");
        actions.style.marginTop = "6px";

        const btnConfirm = document.createElement("button");
        btnConfirm.textContent = "Confirmar";
        btnConfirm.onclick = () => confirmarAg(b.data, b.hora);

        const btnConfirmw = document.createElement("button");
        btnConfirmw.textContent = "Confirmarw";
        btnConfirmw.style.marginLeft = "6px";
        btnConfirmw.onclick = () => confirmarWhatsapp(b.data, b.hora,b.telefone,b.nome);

        const btnCancel = document.createElement("button");
        btnCancel.textContent = "Cancelar";
        btnCancel.style.marginLeft = "6px";
        btnCancel.onclick = () => cancelarAg(b.data, b.hora);

        const btnDelete = document.createElement("button");
        btnDelete.textContent = "Excluir";
        btnDelete.style.marginLeft = "6px";
        btnDelete.onclick = () => excluirAg(b.data, b.hora);

        actions.appendChild(btnConfirm);
        actions.appendChild(btnConfirmw);
        actions.appendChild(btnCancel);
        actions.appendChild(btnDelete);
        div.appendChild(actions);

        section.appendChild(div);
      });

      listaDiv.appendChild(section);
    });

  } catch (err) {
    console.error(err);
    alert('Erro ao carregar agendamentos. Verifique a senha admin e o servidor.');
  }
}
window.carregarAgendamentos = carregarAgendamentos;

/* ações admin: confirmar / cancelar / excluir */
async function confirmarAg(data, hora) {
  if (!confirm('Confirmar este agendamento?')) return;
  await fetch(`${API_BASE}/agendamentos/confirmar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-password": adminPass },
    body: JSON.stringify({ data, hora })
  });
  await carregarAgendamentos();
}
window.confirmarAg = confirmarAg;

async function cancelarAg(data, hora) {
  if (!confirm('Cancelar este agendamento?')) return;
  await fetch(`${API_BASE}/agendamentos/cancelar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-password": adminPass },
    body: JSON.stringify({ data, hora })
  });
  await carregarAgendamentos();
}
window.cancelarAg = cancelarAg;

 function confirmarWhatsapp(telefone, nome, data, horario) {
      if (!telefone) {
        alert('Telefone não disponível para este cliente.');
        return;
      }

      // Formata o número para o formato internacional (Brasil)
      let numero = telefone.replace(/\D/g, '');
      if (numero.startsWith('0')) numero = numero.substring(1);
      if (!numero.startsWith('55')) numero = '55' + numero;

      // Mensagem automática
      const mensagem = `Olá ${nome}! 😊\nSeu agendamento para ${data} às ${horario} foi confirmado.\nKátia Manicure & Pedicure 💅`;
      const url = `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;

      window.open(url, '_blank');
    }


async function excluirAg(data, hora) {
  if (!confirm('Excluir definitivamente este agendamento?')) return;
  await fetch(`${API_BASE}/agendamentos`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-admin-password": adminPass },
    body: JSON.stringify({ data, hora })
  });
  await carregarAgendamentos();
}
window.excluirAg = excluirAg;

/* expose carregarHorarios for direct calls */
window.carregarHorarios = carregarHorarios;