/**
 * Lógica da Tela Focada do Estudante
 * Com:
 * - Botão "Pronto"
 * - Countdown 3 segundos
 * - Cronômetro digital regressivo
 * - Tecnologia Anti-Trapaça (Detecção de troca de aba / perda de foco)
 */

let currentCode = "";
let currentStudentId = "";
let currentMatchId = "";
let lastSeries = "A";
let timerInterval = null;
let isMatchQuestionActive = false;
let hasSubmittedCurrent = false;

// Elementos DOM
const loginScreen = document.getElementById("loginScreen");
const waitingScreen = document.getElementById("waitingScreen");
const matchScreen = document.getElementById("matchScreen");
const finishScreen = document.getElementById("finishScreen");

const joinForm = document.getElementById("joinForm");
const tournamentCodeInput = document.getElementById("tournamentCodeInput");
const studentNameInput = document.getElementById("studentNameInput");

const studentHeaderBadge = document.getElementById("studentHeaderBadge");
const studentSeriesBadge = document.getElementById("studentSeriesBadge");
const studentNameDisplay = document.getElementById("studentNameDisplay");
const leaveTournamentBtn = document.getElementById("leaveTournamentBtn");

const myPlayerName = document.getElementById("myPlayerName");
const opponentName = document.getElementById("opponentName");
const motivationalGoalText = document.getElementById("motivationalGoalText");
const matchRoundBadge = document.getElementById("matchRoundBadge");
const studentTimerBox = document.getElementById("studentTimerBox");
const studentTimerText = document.getElementById("studentTimerText");
const matchScoreDisplay = document.getElementById("matchScoreDisplay");

// Seções de Pronto e Desafio
const readySection = document.getElementById("readySection");
const readyOpponentStatusText = document.getElementById("readyOpponentStatusText");
const playerReadyBtn = document.getElementById("playerReadyBtn");

const questionSection = document.getElementById("questionSection");
const questionText = document.getElementById("questionText");
const hintContainer = document.getElementById("hintContainer");
const hintText = document.getElementById("hintText");
const attemptsBadge = document.getElementById("attemptsBadge");
const answerForm = document.getElementById("answerForm");
const answerInput = document.getElementById("answerInput");
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const feedbackBanner = document.getElementById("feedbackBanner");
const relegationAlert = document.getElementById("relegationAlert");
const relegationSeriesName = document.getElementById("relegationSeriesName");
const tieAlert = document.getElementById("tieAlert");
const tieAlertMsg = document.getElementById("tieAlertMsg");
const waitingOpponentBanner = document.getElementById("waitingOpponentBanner");

// Modais e Overlays
const countdownOverlay = document.getElementById("countdownOverlay");
const countdownNumber = document.getElementById("countdownNumber");
const cheatDisqualifiedModal = document.getElementById("cheatDisqualifiedModal");

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get("code");
  if (codeParam) {
    tournamentCodeInput.value = codeParam.toUpperCase();
  }

  joinForm.addEventListener("submit", handleJoinTournament);
  answerForm.addEventListener("submit", handleSubmitAnswer);

  playerReadyBtn.addEventListener("click", handlePlayerReady);

  leaveTournamentBtn.addEventListener("click", () => {
    if (confirm("Deseja sair desta sala?")) {
      localStorage.removeItem("torneio_student_code");
      localStorage.removeItem("torneio_student_id");
      localStorage.removeItem("torneio_student_name");
      location.reload();
    }
  });

  // Configura a tecnologia anti-trapaça
  initAntiCheatProtection();

  restoreStudentSession();

  // Sockets em Tempo Real
  window.SocketClient.on("student_view_updated", data => {
    renderStudentView(data);
  });

  // Evento de Countdown 3.. 2.. 1..
  window.SocketClient.on("countdown_started", () => {
    startVisualCountdown();
  });

  // Evento de Liberação da Pergunta
  window.SocketClient.on("question_released", data => {
    isMatchQuestionActive = true;
    hasSubmittedCurrent = false;
    readySection.classList.add("hidden");
    questionSection.classList.remove("hidden");
    answerInput.focus();

    if (data && data.timeLimit > 0) {
      startMatchClock(data.timeLimit);
    }
  });

  // Dica liberada
  window.SocketClient.on("hint_unlocked", data => {
    window.SoundFX.hintUnlocked();
    if (data && data.hint) {
      hintContainer.classList.remove("hidden");
      hintText.innerText = data.hint;
      waitingOpponentBanner.classList.add("hidden");
      enableInputForNextTurn();
      showFeedback(
        "💡 Ambos erraram na 1ª tentativa! A DICA DE OURO foi liberada para a 2ª tentativa.",
        "amber"
      );
    }
  });

  // Nova rodada com pergunta aleatória sem repetição e placar
  const handleNewQuestionRound = data => {
    waitingOpponentBanner.classList.add("hidden");
    enableInputForNextTurn();
    hintContainer.classList.add("hidden");

    if (data && (data.newQuestion || data.question)) {
      renderMathQuestion(data.newQuestion || data.question);
    }

    if (data && data.message) {
      showFeedback(data.message, "indigo");
    }

    window.SoundFX.playTone(520, 0.15);
  };

  window.SocketClient.on("round_scored", handleNewQuestionRound);
  window.SocketClient.on("tie_occurred", handleNewQuestionRound);

  // Alertas de Desclassificação Anti-Trapaça
  window.SocketClient.on("disqualified_alert", () => {
    isMatchQuestionActive = false;
    window.SoundFX.wrong();
    cheatDisqualifiedModal.classList.remove("hidden");
  });

  window.SocketClient.on("opponent_disqualified_alert", data => {
    isMatchQuestionActive = false;
    window.SoundFX.victory();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    showFeedback(data.message || "🏆 Seu oponente foi desclassificado por mudar de aba! Vitória!", "emerald");
  });
});

// TECNOLOGIA ANTI-TRAPAÇA: DETECÇÃO DE TROCA DE ABA OU PERDA DE FOCO
function initAntiCheatProtection() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isMatchQuestionActive && !hasSubmittedCurrent) {
      triggerCheatDetected("Troca de aba ou janela minimizada durante a partida");
    }
  });

  window.addEventListener("blur", () => {
    if (isMatchQuestionActive && !hasSubmittedCurrent) {
      triggerCheatDetected("Saída da tela ou abertura de outra janela durante a partida");
    }
  });
}

function triggerCheatDetected(reason) {
  if (!isMatchQuestionActive || hasSubmittedCurrent) return;
  isMatchQuestionActive = false;

  window.SocketClient.emit("cheat_detected", {
    code: currentCode,
    playerId: currentStudentId,
    matchId: currentMatchId,
    reason
  });
}

function dismissCheatModal() {
  cheatDisqualifiedModal.classList.add("hidden");
}

function handlePlayerReady() {
  playerReadyBtn.disabled = true;
  playerReadyBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> VOCÊ ESTÁ PRONTO! AGUARDANDO OPONENTE...';
  playerReadyBtn.className = "w-full py-4 rounded-xl bg-slate-900 border-2 border-emerald-500/50 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2";

  window.SocketClient.emit("player_ready", {
    code: currentCode,
    playerId: currentStudentId,
    matchId: currentMatchId
  });
}

function startVisualCountdown() {
  countdownOverlay.classList.remove("hidden");
  let count = 3;
  countdownNumber.innerText = count;
  window.SoundFX.playTone(440, 0.15, "triangle");

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownNumber.innerText = count;
      countdownNumber.classList.remove("animate-count-pop");
      void countdownNumber.offsetWidth; // reflow
      countdownNumber.classList.add("animate-count-pop");
      window.SoundFX.playTone(440 + (3 - count) * 80, 0.15, "triangle");
    } else if (count === 0) {
      countdownNumber.innerText = "VALENDO! 💥";
      countdownNumber.classList.remove("animate-count-pop");
      void countdownNumber.offsetWidth;
      countdownNumber.classList.add("animate-count-pop");
      window.SoundFX.playTone(880, 0.4, "sine");
    } else {
      clearInterval(interval);
      countdownOverlay.classList.add("hidden");
    }
  }, 1000);
}

function startMatchClock(totalSeconds) {
  studentTimerBox.classList.remove("hidden");
  if (timerInterval) clearInterval(timerInterval);

  let remaining = totalSeconds;
  updateTimerDisplay(remaining);

  timerInterval = setInterval(() => {
    remaining--;
    if (remaining >= 0) {
      updateTimerDisplay(remaining);
    } else {
      clearInterval(timerInterval);
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  studentTimerText.innerText = `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;

  if (seconds <= 15) {
    studentTimerBox.className = "text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse";
  } else {
    studentTimerBox.className = "text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30";
  }
}

function restoreStudentSession() {
  const savedCode = localStorage.getItem("torneio_student_code");
  const savedId = localStorage.getItem("torneio_student_id");
  const savedName = localStorage.getItem("torneio_student_name");

  if (savedCode && (savedId || savedName)) {
    currentCode = savedCode;
    currentStudentId = savedId || "";

    window.SocketClient.emit("join_tournament", {
      code: savedCode,
      role: "estudante",
      studentId: savedId,
      studentName: savedName
    }, res => {
      if (res && res.success) {
        currentStudentId = res.playerId;
        localStorage.setItem("torneio_student_id", res.playerId);
        loginScreen.classList.add("hidden");
        studentHeaderBadge.classList.remove("hidden");
        studentNameDisplay.innerText = savedName || "Aluno";
        myPlayerName.innerText = savedName || "Eu";
        renderStudentView(res.studentView);
      } else {
        localStorage.removeItem("torneio_student_code");
        localStorage.removeItem("torneio_student_id");
        localStorage.removeItem("torneio_student_name");
      }
    });
  }
}

function handleJoinTournament(e) {
  e.preventDefault();
  const code = tournamentCodeInput.value.trim().toUpperCase();
  const name = studentNameInput.value.trim();

  if (!code || !name) return;

  currentCode = code;

  const joinBtn = document.getElementById("joinBtn");
  joinBtn.disabled = true;
  joinBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando na Arena...';

  window.SocketClient.emit("join_tournament", {
    code,
    role: "estudante",
    studentName: name
  }, response => {
    joinBtn.disabled = false;
    joinBtn.innerHTML = '<i class="fa-solid fa-play"></i> Acessar Partida';

    if (response && response.success) {
      currentStudentId = response.playerId;
      localStorage.setItem("torneio_student_code", code);
      localStorage.setItem("torneio_student_id", response.playerId);
      localStorage.setItem("torneio_student_name", name);

      loginScreen.classList.add("hidden");
      studentHeaderBadge.classList.remove("hidden");
      studentNameDisplay.innerText = name;
      myPlayerName.innerText = name;

      renderStudentView(response.studentView);
    } else {
      alert(response?.error || "Erro ao entrar no torneio.");
    }
  });
}

function renderStudentView(view) {
  if (!view) return;

  updateSeriesBadge(view.currentSeries, view.seriesName);

  if (view.disqualified) {
    cheatDisqualifiedModal.classList.remove("hidden");
    isMatchQuestionActive = false;
  }

  if (view.status === "CHAMPION" || view.isChampion) {
    isMatchQuestionActive = false;
    showScreen(finishScreen);

    const seriesKey = (view.currentSeries || "A").toUpperCase();
    const seriesName = view.seriesName || `Série ${seriesKey}`;
    const studentName = view.name || myPlayerName.innerText || "Estudante";

    const badgeEl = document.getElementById("finishSeriesBadge");
    const titleEl = document.getElementById("finishTitle");
    const subtitleEl = document.getElementById("finishSubtitle");
    const messageEl = document.getElementById("finishMessage");
    const iconContainer = document.getElementById("finishIconContainer");
    const iconEl = document.getElementById("finishIcon");

    let confettiColors = ["#f59e0b", "#fbbf24", "#d97706", "#ffffff"];

    if (seriesKey === "A") {
      finishScreen.className = "glass-card p-8 md:p-10 text-center space-y-6 animate-slide-up border-4 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)] bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 transition-all duration-500";
      badgeEl.className = "px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow bg-amber-500/20 text-amber-300 border border-amber-500/40";
      badgeEl.innerHTML = '<i class="fa-solid fa-crown text-amber-400"></i> Série A • Troféu Ouro';
      
      iconContainer.className = "w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto shadow-2xl bg-amber-500/20 text-amber-300 border-2 border-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-bounce";
      iconEl.className = "fa-solid fa-crown";

      titleEl.innerText = "🏆 GRANDE CAMPEÃO DA SÉRIE A!";
      titleEl.className = "text-2xl md:text-3xl font-black text-amber-300 tracking-tight drop-shadow";
      subtitleEl.innerText = "🥇 Troféu Ouro da Elite Matemática";
      subtitleEl.className = "text-xs font-bold uppercase tracking-wider text-amber-400";
      messageEl.innerText = `Parabéns ${studentName}! Você superou todos os adversários e conquistou o título máximo da Série A!`;
      confettiColors = ["#f59e0b", "#fbbf24", "#d97706", "#ffffff"];
    } else if (seriesKey === "B") {
      finishScreen.className = "glass-card p-8 md:p-10 text-center space-y-6 animate-slide-up border-4 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)] bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-950 transition-all duration-500";
      badgeEl.className = "px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow bg-blue-500/20 text-blue-300 border border-blue-500/40";
      badgeEl.innerHTML = '<i class="fa-solid fa-trophy text-blue-400"></i> Série B • Troféu Prata';

      iconContainer.className = "w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto shadow-2xl bg-blue-500/20 text-blue-300 border-2 border-blue-400 drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] animate-bounce";
      iconEl.className = "fa-solid fa-trophy";

      titleEl.innerText = "🥈 GRANDE CAMPEÃO DA SÉRIE B!";
      titleEl.className = "text-2xl md:text-3xl font-black text-blue-300 tracking-tight drop-shadow";
      subtitleEl.innerText = "🥈 Troféu Prata da Superação";
      subtitleEl.className = "text-xs font-bold uppercase tracking-wider text-blue-400";
      messageEl.innerText = `Parabéns ${studentName}! Você deu a volta por cima, lutou até o fim e conquistou o troféu de Campeão da Série B!`;
      confettiColors = ["#3b82f6", "#60a5fa", "#93c5fd", "#ffffff"];
    } else if (seriesKey === "C") {
      finishScreen.className = "glass-card p-8 md:p-10 text-center space-y-6 animate-slide-up border-4 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 transition-all duration-500";
      badgeEl.className = "px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
      badgeEl.innerHTML = '<i class="fa-solid fa-medal text-emerald-400"></i> Série C • Troféu Bronze';

      iconContainer.className = "w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto shadow-2xl bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.6)] animate-bounce";
      iconEl.className = "fa-solid fa-medal";

      titleEl.innerText = "🥉 GRANDE CAMPEÃO DA SÉRIE C!";
      titleEl.className = "text-2xl md:text-3xl font-black text-emerald-300 tracking-tight drop-shadow";
      subtitleEl.innerText = "🥉 Troféu Bronze da Determinação";
      subtitleEl.className = "text-xs font-bold uppercase tracking-wider text-emerald-400";
      messageEl.innerText = `Parabéns ${studentName}! Com foco, garra e persistência matemática, você conquistou o troféu de Campeão da Série C!`;
      confettiColors = ["#10b981", "#34d399", "#6ee7b7", "#f59e0b"];
    } else {
      finishScreen.className = "glass-card p-8 md:p-10 text-center space-y-6 animate-slide-up border-4 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.3)] bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 transition-all duration-500";
      badgeEl.className = "px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow bg-purple-500/20 text-purple-300 border border-purple-500/40";
      badgeEl.innerHTML = `<i class="fa-solid fa-star text-purple-400"></i> ${seriesName}`;

      iconContainer.className = "w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto shadow-2xl bg-purple-500/20 text-purple-300 border-2 border-purple-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.6)] animate-bounce";
      iconEl.className = "fa-solid fa-star";

      titleEl.innerText = `🌟 GRANDE CAMPEÃO DA ${seriesName.toUpperCase()}!`;
      titleEl.className = "text-2xl md:text-3xl font-black text-purple-300 tracking-tight drop-shadow";
      subtitleEl.innerText = `⭐ Troféu de Vitória da ${seriesName}`;
      subtitleEl.className = "text-xs font-bold uppercase tracking-wider text-purple-400";
      messageEl.innerText = `Parabéns ${studentName}! Você brilhou e conquistou com mérito o título da ${seriesName}!`;
      confettiColors = ["#a855f7", "#c084fc", "#e879f9", "#ffffff"];
    }

    confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 }, colors: confettiColors });
    window.SoundFX.victory();
    return;
  }

  if (!view.inMatch) {
    isMatchQuestionActive = false;
    showScreen(waitingScreen);
    document.getElementById("waitingMessage").innerText = view.message || "Aguardando seu oponente ou a próxima rodada...";
    return;
  }

  showScreen(matchScreen);
  currentMatchId = view.matchId;

  opponentName.innerText = view.opponent?.name || "Adversário";
  motivationalGoalText.innerText = view.motivationalGoal || `Placar: ${view.myScore || 0} × ${view.opponentScore || 0}`;
  matchRoundBadge.innerText = `Rodada ${view.round}`;

  if (matchScoreDisplay) {
    matchScoreDisplay.innerText = view.scoreFormatted || `${view.myScore || 0} × ${view.opponentScore || 0}`;
  }

  if (view.currentSeries !== lastSeries && (view.currentSeries === "B" || view.currentSeries === "C")) {
    relegationAlert.classList.remove("hidden");
    relegationSeriesName.innerText = view.seriesName;
    lastSeries = view.currentSeries;
  }

  // CONTROLE DAS FASES: "PRONTO" vs "EM DUELO"
  if (!view.questionVisible) {
    // Fase de Preparação: Pergunta ainda oculta
    isMatchQuestionActive = false;
    readySection.classList.remove("hidden");
    questionSection.classList.add("hidden");

    if (view.isReady) {
      playerReadyBtn.disabled = true;
      playerReadyBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> VOCÊ ESTÁ PRONTO! AGUARDANDO OPONENTE...';
      playerReadyBtn.className = "w-full py-4 rounded-xl bg-slate-900 border-2 border-emerald-500/50 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2";
    } else {
      playerReadyBtn.disabled = false;
      playerReadyBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> ESTOU PRONTO! 🚀';
      playerReadyBtn.className = "w-full py-4 rounded-xl btn-gradient-primary font-black text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2";
    }

    if (view.opponent?.isReady) {
      readyOpponentStatusText.innerHTML = `<span class="text-emerald-400 font-bold">Oponente ${view.opponent.name} já está pronto!</span> Aperte pronto para iniciar a contagem!`;
    } else {
      readyOpponentStatusText.innerText = "Aperte 'Pronto' quando estiver a postos. A partida começará com contagem de 3 segundos assim que ambos estiverem prontos!";
    }
  } else {
    // Fase de Duelo: Pergunta Liberada
    readySection.classList.add("hidden");
    questionSection.classList.remove("hidden");
    isMatchQuestionActive = true;

    renderMathQuestion(view.question?.text || "");

    if (view.timeLimitSeconds > 0 && view.startedAtQuestion) {
      const elapsed = Math.floor((Date.now() - view.startedAtQuestion) / 1000);
      const remaining = Math.max(0, view.timeLimitSeconds - elapsed);
      startMatchClock(remaining);
    }
  }

  if (view.hintUnlocked && view.hint) {
    hintContainer.classList.remove("hidden");
    hintText.innerText = view.hint;
  } else {
    hintContainer.classList.add("hidden");
  }

  if (view.isTiebreaker) {
    tieAlert.classList.remove("hidden");
  } else {
    tieAlert.classList.add("hidden");
  }

  // ESTADO DE SUBMISSÃO
  if (view.hasSubmittedTurn) {
    hasSubmittedCurrent = true;
    waitingOpponentBanner.classList.remove("hidden");
    answerInput.disabled = true;
    submitAnswerBtn.disabled = true;
    submitAnswerBtn.innerHTML = '<i class="fa-solid fa-hourglass-half animate-spin"></i> Aguardando Oponente...';
  } else {
    hasSubmittedCurrent = false;
    waitingOpponentBanner.classList.add("hidden");
    answerInput.disabled = false;
    submitAnswerBtn.disabled = false;
    submitAnswerBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Resposta para a IA';
  }

  attemptsBadge.innerText = `Tentativa ${view.attemptNumber || 1} de 2`;
}

function enableInputForNextTurn() {
  answerInput.disabled = false;
  answerInput.value = "";
  answerInput.focus();
  submitAnswerBtn.disabled = false;
  submitAnswerBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Resposta para a IA';
  hasSubmittedCurrent = false;
}

function renderMathQuestion(text) {
  questionText.innerText = text;
  try {
    if (window.katex && (text.includes("\\") || text.includes("^") || text.includes("_"))) {
      const mathFormatted = text.replace(/\\times/g, "×").replace(/\\div/g, "÷");
      questionText.innerHTML = mathFormatted;
    }
  } catch (e) {
    questionText.innerText = text;
  }
}

function updateSeriesBadge(seriesKey, seriesName) {
  if (!seriesKey) return;
  studentSeriesBadge.innerText = seriesName || `Série ${seriesKey}`;
  if (seriesKey === "A") {
    studentSeriesBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold badge-serie-a";
  } else if (seriesKey === "B") {
    studentSeriesBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold badge-serie-b";
  } else {
    studentSeriesBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold badge-serie-c";
  }
}

function showScreen(screenEl) {
  [loginScreen, waitingScreen, matchScreen, finishScreen].forEach(s => s.classList.add("hidden"));
  screenEl.classList.remove("hidden");
}

function handleSubmitAnswer(e) {
  e.preventDefault();
  const answer = answerInput.value.trim();
  if (!answer) return;

  submitAnswerBtn.disabled = true;
  submitAnswerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando Resposta...';
  hasSubmittedCurrent = true;

  window.SocketClient.emit("submit_answer", {
    code: currentCode,
    playerId: currentStudentId,
    matchId: currentMatchId,
    answer
  }, res => {
    if (!res) return;

    if (res.waitingOpponent) {
      waitingOpponentBanner.classList.remove("hidden");
      submitAnswerBtn.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Aguardando Oponente...';
      showFeedback("✅ Resposta registrada! Aguardando o oponente responder para a IA comparar.", "indigo");
      return;
    }

    waitingOpponentBanner.classList.add("hidden");

    if (res.matchFinished) {
      isMatchQuestionActive = false;
      answerInput.value = "";

      if (res.winnerId === currentStudentId) {
        window.SoundFX.victory();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        showFeedback(`🎉 VITÓRIA NA DISPUTA! ${res.message}`, "emerald");
      } else {
        window.SoundFX.wrong();
        showFeedback(`❌ Oponente venceu a disputa. ${res.message}`, "rose");
      }
      return;
    }

    // A partida continua: ou dica liberada ou nova questão sorteada
    if (res.event === "HINT_UNLOCKED") {
      enableInputForNextTurn();
      hintContainer.classList.remove("hidden");
      hintText.innerText = res.hint;
      showFeedback("💡 Ambos erraram na 1ª tentativa! A DICA DE OURO foi liberada para a 2ª tentativa.", "amber");
    } else {
      enableInputForNextTurn();
      hintContainer.classList.add("hidden");

      if (res.newQuestion) {
        renderMathQuestion(res.newQuestion);
      }

      if (res.isCorrect) {
        window.SoundFX.correct();
        showFeedback(`✅ Ponto marcado! ${res.message}`, "emerald");
      } else {
        showFeedback(res.message, "indigo");
      }
    }
  });
}

function showFeedback(msg, color) {
  feedbackBanner.classList.remove("hidden");
  if (color === "emerald") {
    feedbackBanner.className = "p-3.5 rounded-xl text-center text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-slide-up";
  } else if (color === "amber") {
    feedbackBanner.className = "p-3.5 rounded-xl text-center text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-slide-up";
  } else if (color === "purple") {
    feedbackBanner.className = "p-3.5 rounded-xl text-center text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-slide-up";
  } else if (color === "indigo") {
    feedbackBanner.className = "p-3.5 rounded-xl text-center text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-slide-up";
  } else {
    feedbackBanner.className = "p-3.5 rounded-xl text-center text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-slide-up";
  }
  feedbackBanner.innerText = msg;
}

function insertSymbol(sym) {
  answerInput.value += sym;
  answerInput.focus();
}

function clearAnswer() {
  answerInput.value = "";
  answerInput.focus();
}
