/**
 * Lógica do Painel do Professor
 * Com:
 * - Entrada Opcional de Alunos & Lobby em Tempo Real
 * - Chaveamento de ~7 Alunos por Chave
 * - Séries Dinâmicas (A, B, C, D, E, F...) em Tela Panorâmica Unificada
 * - Temporizador e Anti-Trapaça
 */

const PROFESSOR_PASSWORD = "josenetomat";

let currentTournamentData = null;
let chartAccuracyInstance = null;
let chartWinRateInstance = null;
let matchTimerInterval = null;

// Elementos de Autenticação
const passwordGateModal = document.getElementById("passwordGateModal");
const passwordForm = document.getElementById("passwordForm");
const professorPasswordInput = document.getElementById("professorPasswordInput");
const passwordErrorMsg = document.getElementById("passwordErrorMsg");
const logoutProfBtn = document.getElementById("logoutProfBtn");

// Elementos de Retomada de Torneio
const resumeBanner = document.getElementById("resumeBanner");
const resumeTournamentTitle = document.getElementById("resumeTournamentTitle");
const resumeTournamentCode = document.getElementById("resumeTournamentCode");
const resumeTournamentBtn = document.getElementById("resumeTournamentBtn");

// Elementos de Configuração
const setupSection = document.getElementById("setupSection");
const activeTournamentSection = document.getElementById("activeTournamentSection");
const playersListInput = document.getElementById("playersListInput");
const questionsTextInput = document.getElementById("questionsTextInput");
const timeLimitSelect = document.getElementById("timeLimitSelect");
const displayTimeLimit = document.getElementById("displayTimeLimit");
const playerCountBadge = document.getElementById("playerCountBadge");
const questionCountBadge = document.getElementById("questionCountBadge");
const createTournamentBtn = document.getElementById("createTournamentBtn");

// Elementos da Sala Ativa
const displayTournamentCode = document.getElementById("displayTournamentCode");
const activeTournamentBadge = document.getElementById("activeTournamentBadge");
const liveTournamentTitle = document.getElementById("liveTournamentTitle");
const tournamentStatusBadge = document.getElementById("tournamentStatusBadge");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const startTournamentBtn = document.getElementById("startTournamentBtn");
const simulateRoundBtn = document.getElementById("simulateRoundBtn");
const resetTournamentBtn = document.getElementById("resetTournamentBtn");
const toggleStatsBtn = document.getElementById("toggleStatsBtn");
const statsSection = document.getElementById("statsSection");

// Lobby em Tempo Real
const lobbyWaitingCard = document.getElementById("lobbyWaitingCard");
const lobbyCountBadge = document.getElementById("lobbyCountBadge");
const lobbyStudentsGrid = document.getElementById("lobbyStudentsGrid");
const lobbyCodeHighlight = document.getElementById("lobbyCodeHighlight");
const lobbyAddSampleBtn = document.getElementById("lobbyAddSampleBtn");

// Container Panorâmico das Séries Dinâmicas
const panoramicContainerWrap = document.getElementById("panoramicContainerWrap");
const dynamicSeriesColumns = document.getElementById("dynamicSeriesColumns");
const podiumBanner = document.getElementById("podiumBanner");
const dynamicPodiumGrid = document.getElementById("dynamicPodiumGrid");

// Modal de Prompt
const promptModal = document.getElementById("promptModal");
const openPromptModalBtn = document.getElementById("openPromptModalBtn");
const generatedPromptText = document.getElementById("generatedPromptText");
const copyPromptBtn = document.getElementById("copyPromptBtn");
const applyPromptBtn = document.getElementById("applyPromptBtn");

const SAMPLE_STUDENTS = [
  "Sofia Albuquerque",
  "Gabriel Ribeiro",
  "Laura Mendes",
  "Matheus Nogueira",
  "Beatriz Ferreira",
  "Pedro Henrique",
  "Larissa Carvalho",
  "Lucas Silveira"
];

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  initAuth();

  loadPresetBank("aritmetica");
  updatePlayerCount();
  updateQuestionCount();

  playersListInput.addEventListener("input", updatePlayerCount);
  questionsTextInput.addEventListener("input", updateQuestionCount);

  document.getElementById("fillSamplePlayersBtn").addEventListener("click", () => {
    playersListInput.value = SAMPLE_STUDENTS.join("\n");
    updatePlayerCount();
  });

  createTournamentBtn.addEventListener("click", handleCreateTournament);

  startTournamentBtn.addEventListener("click", () => {
    window.SocketClient.emit("start_tournament", {}, res => {
      if (!res.success) alert(res.error || "Erro ao iniciar torneio");
    });
  });

  simulateRoundBtn.addEventListener("click", () => {
    window.SocketClient.emit("simulate_entire_round", {}, res => {
      if (res && res.success) {
        window.SoundFX.correct();
      }
    });
  });

  resetTournamentBtn.addEventListener("click", () => {
    if (confirm("Deseja criar um novo torneio?")) {
      localStorage.removeItem("torneio_prof_code");
      setupSection.classList.remove("hidden");
      activeTournamentSection.classList.add("hidden");
      resumeBanner.classList.add("hidden");
    }
  });

  // Botão de adicionar 8 alunos no lobby
  lobbyAddSampleBtn.addEventListener("click", () => {
    window.SocketClient.emit("add_players", { names: SAMPLE_STUDENTS }, () => {
      window.SoundFX.correct();
    });
  });

  toggleStatsBtn.addEventListener("click", () => {
    statsSection.classList.toggle("hidden");
    if (!statsSection.classList.contains("hidden")) {
      statsSection.scrollIntoView({ behavior: "smooth" });
      fetchStudentStats();
    }
  });

  copyCodeBtn.addEventListener("click", () => {
    if (!currentTournamentData) return;
    navigator.clipboard.writeText(currentTournamentData.code).then(() => {
      copyCodeBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i>';
      setTimeout(() => {
        copyCodeBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      }, 1500);
    });
  });

  logoutProfBtn.addEventListener("click", () => {
    sessionStorage.removeItem("torneio_prof_auth");
    passwordGateModal.classList.remove("hidden");
  });

  openPromptModalBtn.addEventListener("click", openPromptModal);
  copyPromptBtn.addEventListener("click", copyGeneratedPrompt);
  applyPromptBtn.addEventListener("click", copyGeneratedPrompt);

  ["promptTopicInput", "promptGradeInput", "promptCountInput", "promptDifficultyInput"].forEach(id => {
    document.getElementById(id).addEventListener("input", refreshPromptContent);
  });

  resumeTournamentBtn.addEventListener("click", () => {
    const code = localStorage.getItem("torneio_prof_code") || resumeTournamentCode.innerText;
    reconnectTournament(code);
  });

  if (matchTimerInterval) clearInterval(matchTimerInterval);
  matchTimerInterval = setInterval(updateLiveTimers, 1000);

  // Sockets
  window.SocketClient.on("professor_view_updated", data => {
    renderProfessorView(data);
  });

  window.SocketClient.on("player_joined_lobby", data => {
    window.SoundFX.playTone(550, 0.1);
  });
});

function initAuth() {
  const isAuth = sessionStorage.getItem("torneio_prof_auth") === "true";

  if (isAuth) {
    passwordGateModal.classList.add("hidden");
    checkActiveTournament();
  } else {
    passwordGateModal.classList.remove("hidden");
  }

  passwordForm.addEventListener("submit", e => {
    e.preventDefault();
    const pass = professorPasswordInput.value.trim();

    fetch("/api/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          sessionStorage.setItem("torneio_prof_auth", "true");
          passwordGateModal.classList.add("hidden");
          passwordErrorMsg.classList.add("hidden");
          checkActiveTournament();
        } else {
          passwordErrorMsg.classList.remove("hidden");
          professorPasswordInput.value = "";
          professorPasswordInput.focus();
        }
      })
      .catch(() => {
        if (pass === PROFESSOR_PASSWORD) {
          sessionStorage.setItem("torneio_prof_auth", "true");
          passwordGateModal.classList.add("hidden");
          checkActiveTournament();
        } else {
          passwordErrorMsg.classList.remove("hidden");
        }
      });
  });
}

function checkActiveTournament() {
  const savedCode = localStorage.getItem("torneio_prof_code");

  if (savedCode) {
    reconnectTournament(savedCode);
    return;
  }

  fetch("/api/active-tournaments")
    .then(r => r.json())
    .then(tournaments => {
      if (tournaments && tournaments.length > 0) {
        const latest = tournaments[tournaments.length - 1];
        resumeTournamentTitle.innerText = latest.title;
        resumeTournamentCode.innerText = latest.code;
        resumeBanner.classList.remove("hidden");
      }
    })
    .catch(() => {});
}

function reconnectTournament(code) {
  window.SocketClient.emit("reconnect_professor", {
    code,
    password: PROFESSOR_PASSWORD
  }, res => {
    if (res && res.success) {
      localStorage.setItem("torneio_prof_code", res.code);
      resumeBanner.classList.add("hidden");
      setupSection.classList.add("hidden");
      activeTournamentSection.classList.remove("hidden");
      renderProfessorView(res.view);
    } else {
      localStorage.removeItem("torneio_prof_code");
      resumeBanner.classList.add("hidden");
    }
  });
}

function updatePlayerCount() {
  const lines = playersListInput.value.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
  playerCountBadge.innerText = `${lines.length} pré-inscrito${lines.length !== 1 ? "s" : ""}`;
}

function updateQuestionCount() {
  const text = questionsTextInput.value;
  const matches = text.match(/(?:Pergunta|Quest[aã]o|P)\s*:/gi);
  const count = matches ? matches.length : 0;
  questionCountBadge.innerText = `${count} quest${count !== 1 ? "ões" : "ão"}`;
}

function loadPresetBank(type) {
  fetch("/api/default-banks")
    .then(r => r.json())
    .then(banks => {
      const bank = banks[type];
      if (!bank) return;
      let text = "";
      bank.forEach(q => {
        text += `Pergunta: ${q.question}\nResposta: ${q.answer}\nDica: ${q.hint}\n---\n`;
      });
      questionsTextInput.value = text.trim();
      updateQuestionCount();
    })
    .catch(() => {
      questionsTextInput.value = `Pergunta: Quanto é 15 x 14?\nResposta: 210\nDica: Decomponha 14 em 10 + 4: (15x10) + (15x4).\n---\nPergunta: Resolva 3x - 7 = 20\nResposta: 9\nDica: Some 7 aos dois lados e divida por 3.`;
      updateQuestionCount();
    });
}

function handleCreateTournament() {
  const title = document.getElementById("tournamentTitle").value.trim();
  const rawPlayers = playersListInput.value.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
  const questionsText = questionsTextInput.value.trim();
  const timeLimitSeconds = Number(timeLimitSelect.value);

  createTournamentBtn.disabled = true;
  createTournamentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Abrindo Sala...';

  window.SocketClient.emit("create_tournament", {
    title,
    playersList: rawPlayers, // Opcional! Pode ir vazio.
    questionsText,
    timeLimitSeconds,
    password: PROFESSOR_PASSWORD
  }, response => {
    createTournamentBtn.disabled = false;
    createTournamentBtn.innerHTML = '<i class="fa-solid fa-door-open"></i> Criar Torneio e Abrir Sala';

    if (response && response.success) {
      localStorage.setItem("torneio_prof_code", response.code);
      setupSection.classList.add("hidden");
      activeTournamentSection.classList.remove("hidden");
      renderProfessorView(response.view);
    } else {
      alert(response?.error || "Erro ao criar torneio.");
    }
  });
}

function renderProfessorView(data) {
  if (!data) return;
  currentTournamentData = data;

  localStorage.setItem("torneio_prof_code", data.code);

  liveTournamentTitle.innerText = data.title;
  displayTournamentCode.innerText = data.code;
  lobbyCodeHighlight.innerText = data.code;
  activeTournamentBadge.innerText = data.code;
  activeTournamentBadge.classList.remove("hidden");

  displayTimeLimit.innerText = data.timeLimitSeconds > 0 ? `${data.timeLimitSeconds}s` : "Livre";

  // SE TORNEIO EM SETUP -> EXIBE LOBBY EM TEMPO REAL
  if (data.status === "SETUP") {
    tournamentStatusBadge.innerText = "Lobby Aberto (Aguardando Alunos)";
    tournamentStatusBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider";
    
    lobbyWaitingCard.classList.remove("hidden");
    panoramicContainerWrap.classList.add("hidden");
    startTournamentBtn.classList.remove("hidden");

    renderLobby(data.players);
  } else {
    // SE TORNEIO EM ANDAMENTO OU FINALIZADO -> EXIBE TELA PANORÂMICA
    lobbyWaitingCard.classList.add("hidden");
    panoramicContainerWrap.classList.remove("hidden");
    startTournamentBtn.classList.add("hidden");

    if (data.status === "RUNNING") {
      tournamentStatusBadge.innerText = "Torneio Ao Vivo";
      tournamentStatusBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider";
    } else if (data.status === "FINISHED") {
      tournamentStatusBadge.innerText = "Torneio Finalizado";
      tournamentStatusBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider";
    }

    renderDynamicSeriesPanoramic(data.series);
  }

  renderPodium(data.podium);
  fetchStudentStats();
}

function renderLobby(players) {
  const count = players ? players.length : 0;
  lobbyCountBadge.innerText = `${count} aluno${count !== 1 ? "s" : ""} conectado${count !== 1 ? "s" : ""}`;

  if (count >= 2) {
    startTournamentBtn.disabled = false;
    startTournamentBtn.innerHTML = `<i class="fa-solid fa-play"></i> Iniciar Torneio (${count} Alunos)`;
  } else {
    startTournamentBtn.innerHTML = `<i class="fa-solid fa-play"></i> Iniciar Torneio (Aguardando Alunos)`;
  }

  if (!players || players.length === 0) {
    lobbyStudentsGrid.innerHTML = `
      <div class="col-span-full py-8 text-center text-slate-500 text-xs italic">
        Nenhum aluno conectado no momento. Peça para os alunos abrirem o link e digitarem o código <strong>${displayTournamentCode.innerText}</strong>!
      </div>
    `;
    return;
  }

  let html = "";
  players.forEach((p, idx) => {
    html += `
      <div class="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 flex items-center gap-2.5 animate-slide-up shadow">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow">
          ${p.name.charAt(0).toUpperCase()}
        </div>
        <div class="overflow-hidden">
          <div class="text-xs font-bold text-white truncate">${p.name}</div>
          <div class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Pronto no Lobby
          </div>
        </div>
      </div>
    `;
  });
  lobbyStudentsGrid.innerHTML = html;
}

/**
 * Renderiza dinamicamente TODAS as séries geradas (Série A, B, C, D, E, F...)
 * lado a lado na tela panorâmica!
 */
function renderDynamicSeriesPanoramic(seriesDict) {
  if (!seriesDict) return;

  const entries = Object.values(seriesDict);
  let html = "";

  entries.forEach(seriesObj => {
    const theme = seriesObj.theme || {
      name: seriesObj.name,
      border: "border-t-slate-500",
      text: "text-slate-300",
      badge: "badge-serie-a",
      icon: "fa-trophy"
    };

    const nextSeriesText = seriesObj.key === "A" ? "Perdedores ➜ Série B" :
                           seriesObj.key === "B" ? "Perdedores ➜ Série C" :
                           seriesObj.key === "C" ? "Perdedores ➜ Série D" : "Rebaixamento";

    html += `
      <div class="glass-card p-4 border-t-4 ${theme.border} space-y-3 shadow-lg">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-black ${theme.text} uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid ${theme.icon}"></i> ${seriesObj.name}
            </h3>
          </div>
          <span class="text-[10px] text-slate-400">${nextSeriesText}</span>
        </div>
        <div id="matchesList_${seriesObj.key}" class="space-y-3">
          ${renderMatchesHtml(seriesObj.key, seriesObj.matches)}
        </div>
      </div>
    `;
  });

  dynamicSeriesColumns.innerHTML = html;
}

function renderMatchesHtml(seriesKey, matches) {
  if (!matches || matches.length === 0) {
    return `
      <div class="py-6 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-500 text-xs">
        <i class="fa-solid fa-hourglass-half mb-1 block text-slate-600"></i>
        ${seriesKey === 'A' ? 'Aguardando início pelo professor.' : `Sem confrontos na ${seriesKey} no momento.`}
      </div>
    `;
  }

  let html = "";
  matches.forEach(m => {
    const isFinished = m.status === "FINISHED";
    const p1Winner = isFinished && m.winnerId === m.player1.id;
    const p2Winner = isFinished && m.winnerId === m.player2.id;
    const isDisqualified = !!m.disqualifiedId;

    const p1ReadyBadge = m.player1.isReady 
      ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Pronto ✓</span>'
      : '<span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Aguardando</span>';

    const p2ReadyBadge = m.player2.isReady 
      ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Pronto ✓</span>'
      : '<span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Aguardando</span>';

    let statusPill = "";
    if (isFinished) {
      if (isDisqualified) {
        statusPill = `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-500/30 text-rose-300 border border-rose-500/40">🚨 Trapaça (Aba)</span>`;
      } else {
        statusPill = `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400">Concluída</span>`;
      }
    } else if (m.isCountingDown) {
      statusPill = `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/30 text-amber-300 animate-pulse">Countdown 3s</span>`;
    } else if (!m.questionVisible) {
      statusPill = `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-500/20 text-indigo-300">Aguardando "Pronto"</span>`;
    } else {
      statusPill = `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-400 animate-pulse">Em Duelo</span>`;
    }

    const timerDisplay = getMatchRemainingTimeText(m);

    html += `
      <div class="p-3.5 rounded-xl bg-slate-900/90 border ${isFinished ? 'border-slate-800 opacity-90' : 'border-indigo-500/40 shadow-md shadow-indigo-500/10'} space-y-2.5">
        <div class="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-1.5">
          <span class="font-bold text-slate-300">Rodada ${m.round}</span>
          <div class="flex items-center gap-1.5">
            ${timerDisplay}
            ${statusPill}
          </div>
        </div>

        <div class="space-y-1.5">
          <!-- Player 1 -->
          <div class="flex items-center justify-between p-2 rounded-lg ${p1Winner ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold' : 'bg-slate-950/70'} text-xs">
            <div class="flex items-center gap-2">
              <span>${p1Winner ? '👑' : (m.disqualifiedId === m.player1.id ? '🚨' : '👤')}</span>
              <span class="${m.disqualifiedId === m.player1.id ? 'line-through text-rose-400' : ''}">${m.player1.name}</span>
              ${!isFinished ? p1ReadyBadge : ''}
              ${m.player1.hasSubmittedTurn ? '<span class="text-[9px] text-indigo-300 font-bold">Enviou ✓</span>' : ''}
            </div>
            <div class="text-[10px]">
              ${renderAttemptBadges(m.player1.attempts)}
            </div>
          </div>

          <!-- Player 2 -->
          <div class="flex items-center justify-between p-2 rounded-lg ${p2Winner ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold' : 'bg-slate-950/70'} text-xs">
            <div class="flex items-center gap-2">
              <span>${p2Winner ? '👑' : (m.disqualifiedId === m.player2.id ? '🚨' : '👤')}</span>
              <span class="${m.disqualifiedId === m.player2.id ? 'line-through text-rose-400' : ''}">${m.player2.name}</span>
              ${!isFinished ? p2ReadyBadge : ''}
              ${m.player2.hasSubmittedTurn ? '<span class="text-[9px] text-indigo-300 font-bold">Enviou ✓</span>' : ''}
            </div>
            <div class="text-[10px]">
              ${renderAttemptBadges(m.player2.attempts)}
            </div>
          </div>
        </div>

        <!-- Pergunta e Gabarito -->
        <div class="p-2 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[11px] space-y-1">
          <div class="text-slate-300">
            <strong>Q:</strong> ${m.question.question}
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
            <span class="${m.hintUnlocked ? 'text-amber-400 font-bold' : 'text-slate-500'}">
              ${m.hintUnlocked ? '💡 Dica Liberada' : 'Tentativa ' + m.attemptNumber + ' de 2'}
            </span>
            ${!isFinished ? `
              <button onclick="simulateMatch('${m.id}')" class="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] font-semibold transition">
                ⚡ Simular
              </button>
            ` : `<span class="text-slate-500 font-mono">Gabarito: <strong>${m.question.answer}</strong></span>`}
          </div>
        </div>
      </div>
    `;
  });

  return html;
}

function getMatchRemainingTimeText(match) {
  if (match.status === "FINISHED" || !match.questionVisible || !match.startedAtQuestion || !match.timeLimitSeconds) {
    return "";
  }

  const elapsedSec = Math.floor((Date.now() - match.startedAtQuestion) / 1000);
  const remainingSec = Math.max(0, match.timeLimitSeconds - elapsedSec);

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const formatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  const isLow = remainingSec <= 15;
  return `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isLow ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-300'}"><i class="fa-regular fa-clock"></i> ${formatted}</span>`;
}

function updateLiveTimers() {
  if (!currentTournamentData || currentTournamentData.status !== "RUNNING") return;
  const hasActive = currentTournamentData.matches && currentTournamentData.matches.some(m => m.status === "ACTIVE" && m.questionVisible);
  if (hasActive) {
    renderDynamicSeriesPanoramic(currentTournamentData.series);
  }
}

function renderAttemptBadges(attempts) {
  if (!attempts || attempts.length === 0) {
    return `<span class="text-slate-500">-</span>`;
  }
  return attempts.map((att, i) => {
    if (att.isCorrect) {
      return `<span class="px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">T${i+1}:✓</span>`;
    } else {
      return `<span class="px-1 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">T${i+1}:✗</span>`;
    }
  }).join(" ");
}

function simulateMatch(matchId) {
  window.SocketClient.emit("simulate_match_step", { matchId });
}

function renderPodium(podium) {
  if (!podium) return;
  const entries = Object.entries(podium);

  if (entries.length > 0) {
    podiumBanner.classList.remove("hidden");
    let html = "";

    entries.forEach(([key, champ]) => {
      const theme = currentTournamentData?.series[key]?.theme || {
        name: `Série ${key}`,
        badge: "badge-serie-a",
        text: "text-amber-300"
      };

      html += `
        <div class="glass-card p-4 text-center border-t-4 ${theme.border || 'border-t-amber-500'} flex flex-col items-center">
          <span class="px-2.5 py-0.5 rounded-full ${theme.badge} text-[10px] uppercase font-bold mb-2">Campeão ${champ.series}</span>
          <div class="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-2xl mb-1 border border-amber-400">
            <i class="fa-solid fa-crown"></i>
          </div>
          <h4 class="text-base font-black ${theme.text}">${champ.name}</h4>
          <p class="text-[10px] text-slate-400">Troféu ${theme.label || 'Campeão'}</p>
        </div>
      `;
    });

    dynamicPodiumGrid.innerHTML = html;

    if (!podiumBanner.dataset.confettiFired) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      window.SoundFX.victory();
      podiumBanner.dataset.confettiFired = "true";
    }
  }
}

function fetchStudentStats() {
  window.SocketClient.emit("get_student_stats", {}, res => {
    if (!res || !res.success) return;
    updateStatsDashboard(res.stats);
  });
}

function updateStatsDashboard(stats) {
  if (!stats) return;

  const totalPlayers = stats.length;
  const matchesPlayed = stats.reduce((acc, s) => acc + s.matchesPlayed, 0) / 2;
  const hintsGiven = stats.reduce((acc, s) => acc + s.hintsReceived, 0);
  const avgAccuracy = totalPlayers > 0
    ? Math.round(stats.reduce((acc, s) => acc + s.accuracyPercent, 0) / totalPlayers)
    : 0;

  document.getElementById("metricTotalPlayers").innerText = totalPlayers;
  document.getElementById("metricMatchesPlayed").innerText = Math.round(matchesPlayed);
  document.getElementById("metricHintsGiven").innerText = hintsGiven;
  document.getElementById("metricAvgAccuracy").innerText = `${avgAccuracy}%`;

  const tbody = document.getElementById("studentStatsTableBody");
  let tableHtml = "";
  stats.forEach(s => {
    tableHtml += `
      <tr class="hover:bg-slate-900/60 transition">
        <td class="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
          <span>${s.isChampion ? '👑' : '👤'}</span>
          <span>${s.name}</span>
          ${s.disqualifications > 0 ? '<span class="text-[10px] text-rose-400 font-bold" title="Desclassificado por aba">🚨</span>' : ''}
        </td>
        <td class="py-2 px-2"><span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">Série ${s.currentSeries}</span></td>
        <td class="py-2 px-2 text-center">${s.matchesPlayed}</td>
        <td class="py-2 px-2 text-center font-bold text-emerald-400">${s.matchesWon}</td>
        <td class="py-2 px-2 text-center text-indigo-300">${s.firstAttemptSuccess}</td>
        <td class="py-2 px-2 text-center text-amber-300">${s.secondAttemptSuccess} (💡 ${s.hintsReceived})</td>
        <td class="py-2 px-2 text-center">
          <span class="font-mono text-[11px]">${s.accuracyPercent}%</span>
        </td>
        <td class="py-2 px-2 text-right">
          <button onclick="viewStudentDetails('${s.id}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 text-[11px] transition">
            Ver
          </button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = tableHtml;

  renderCharts(stats);
}

function renderCharts(stats) {
  const labels = stats.map(s => s.name.split(" ")[0]);
  const firstAttemptData = stats.map(s => s.firstAttemptSuccess);
  const secondAttemptData = stats.map(s => s.secondAttemptSuccess);
  const accuracyData = stats.map(s => s.accuracyPercent);

  const ctxAcc = document.getElementById("chartAccuracy");
  if (ctxAcc) {
    if (chartAccuracyInstance) chartAccuracyInstance.destroy();
    chartAccuracyInstance = new Chart(ctxAcc, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Acertos 1ª Tentativa",
            data: firstAttemptData,
            backgroundColor: "rgba(99, 102, 241, 0.8)",
            borderRadius: 4
          },
          {
            label: "Acertos 2ª Tentativa (com Dica)",
            data: secondAttemptData,
            backgroundColor: "rgba(245, 158, 11, 0.8)",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#94a3b8", font: { size: 10 } } }
        },
        scales: {
          x: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: "#94a3b8", font: { size: 10 }, precision: 0 }, grid: { color: "#1e293b" } }
        }
      }
    });
  }

  const ctxWin = document.getElementById("chartWinRate");
  if (ctxWin) {
    if (chartWinRateInstance) chartWinRateInstance.destroy();
    chartWinRateInstance = new Chart(ctxWin, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Aproveitamento (%)",
            data: accuracyData,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#94a3b8", font: { size: 10 } } }
        },
        scales: {
          x: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { display: false } },
          y: { min: 0, max: 100, ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1e293b" } }
        }
      }
    });
  }
}

function viewStudentDetails(studentId) {
  window.SocketClient.emit("get_student_stats", {}, res => {
    if (!res || !res.success) return;
    const student = res.stats.find(s => s.id === studentId);
    if (!student) return;

    document.getElementById("modalStudentName").innerText = `Histórico: ${student.name}`;
    const body = document.getElementById("modalStudentBody");

    if (!student.matchHistory || student.matchHistory.length === 0) {
      body.innerHTML = `<p class="text-slate-400">Nenhuma partida registrada ainda.</p>`;
    } else {
      let html = "";
      student.matchHistory.forEach((m, idx) => {
        html += `
          <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-indigo-300">Partida ${idx + 1} (Série ${m.series})</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.won ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                ${m.won ? 'Vitória' : 'Derrota (Rebaixado)'}
              </span>
            </div>
            <p class="text-slate-300"><strong>Adversário:</strong> ${m.opponent}</p>
            <p class="text-slate-400 font-mono text-[11px]"><strong>Questão:</strong> ${m.question}</p>
          </div>
        `;
      });
      body.innerHTML = html;
    }

    document.getElementById("studentDetailModal").classList.remove("hidden");
  });
}

function closeStudentModal() {
  document.getElementById("studentDetailModal").classList.add("hidden");
}

function openPromptModal() {
  refreshPromptContent();
  promptModal.classList.remove("hidden");
}

function closePromptModal() {
  promptModal.classList.add("hidden");
}

function refreshPromptContent() {
  const topic = document.getElementById("promptTopicInput").value;
  const gradeLevel = document.getElementById("promptGradeInput").value;
  const count = document.getElementById("promptCountInput").value;
  const difficulty = document.getElementById("promptDifficultyInput").value;

  fetch("/api/generate-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "questions",
      options: { topic, gradeLevel, count, difficulty }
    })
  })
    .then(r => r.json())
    .then(data => {
      generatedPromptText.value = data.prompt;
    });
}

function copyGeneratedPrompt() {
  const text = generatedPromptText.value;
  navigator.clipboard.writeText(text).then(() => {
    applyPromptBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> Copiado com Sucesso!';
    setTimeout(() => {
      applyPromptBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar para Área de Transferência';
      closePromptModal();
    }, 1200);
  });
}
