/**
 * Servidor Principal - Torneio de Matemática
 * Express + Socket.io com:
 * - Autenticação por senha josenetomat
 * - Persistência em disco
 * - Entrada opcional de estudantes na criação e Lobby ao vivo
 * - Séries dinâmicas (A, B, C, D, E, F, G)
 * - Botão "Pronto" + Countdown 3s
 * - Detecção Anti-Trapaça (troca de aba)
 * - Temporizador por duelo configurável
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const os = require("os");
const fs = require("fs");

const TournamentEngine = require("./lib/tournament-engine");
const {
  DEFAULT_QUESTION_BANKS,
  parseQuestionsFromText
} = require("./lib/question-parser");
const {
  generateQuestionBankPrompt,
  generateLiveRefereePrompt,
  generatePostTournamentFeedbackPrompt
} = require("./lib/prompt-generator");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
const PROFESSOR_PASSWORD = "josenetomat";

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "tournaments.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const activeTournaments = new Map();

function saveTournamentsToDisk() {
  try {
    const serialized = {};
    for (const [code, engine] of activeTournaments.entries()) {
      serialized[code] = engine.toJSON();
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(serialized, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar torneios no disco:", err.message);
  }
}

function loadTournamentsFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        for (const [code, data] of Object.entries(parsed)) {
          const engine = TournamentEngine.fromJSON(data);
          activeTournaments.set(code, engine);
        }
        console.log(`💾 ${activeTournaments.size} torneio(s) restaurado(s) do disco.`);
      }
    }
  } catch (err) {
    console.error("Erro ao restaurar torneios:", err.message);
  }
}

loadTournamentsFromDisk();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// ---------------- REST ENDPOINTS ----------------

app.post("/api/verify-password", (req, res) => {
  const { password } = req.body;
  const isValid = password === PROFESSOR_PASSWORD;
  res.json({ success: isValid });
});

app.get("/api/network-info", (req, res) => {
  const ip = getLocalNetworkIp();
  res.json({
    ip,
    port: PORT,
    localUrl: `http://localhost:${PORT}`,
    networkUrl: `http://${ip}:${PORT}`
  });
});

app.get("/api/default-banks", (req, res) => {
  res.json(DEFAULT_QUESTION_BANKS);
});

app.post("/api/parse-questions", (req, res) => {
  const { text } = req.body;
  const parsed = parseQuestionsFromText(text || "");
  res.json({ count: parsed.length, questions: parsed });
});

app.post("/api/generate-prompt", (req, res) => {
  const { type, options } = req.body;
  let prompt = "";

  if (type === "questions") {
    prompt = generateQuestionBankPrompt(options);
  } else if (type === "referee") {
    const { question, studentAnswer, officialAnswer } = options || {};
    prompt = generateLiveRefereePrompt(question, studentAnswer, officialAnswer);
  } else if (type === "feedback") {
    const { summary } = options || {};
    prompt = generatePostTournamentFeedbackPrompt(summary);
  } else {
    prompt = generateQuestionBankPrompt();
  }

  res.json({ prompt });
});

app.get("/api/active-tournaments", (req, res) => {
  const list = [];
  for (const [code, engine] of activeTournaments.entries()) {
    list.push({
      code,
      title: engine.title,
      status: engine.status,
      playerCount: engine.players.size,
      timeLimitSeconds: engine.timeLimitSeconds,
      createdAt: engine.createdAt
    });
  }
  res.json(list);
});

// ---------------- SOCKET.IO REALTIME ----------------

io.on("connection", socket => {
  let currentTournamentCode = null;
  let currentRole = null;
  let currentStudentId = null;

  // PROFESSOR: Cria novo torneio (jogadores agora são 100% opcionais)
  socket.on("create_tournament", (data, callback) => {
    try {
      const { title, questionsText, bankPreset, playersList, password, timeLimitSeconds } = data || {};

      if (password !== PROFESSOR_PASSWORD) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Senha incorreta. Acesso negado." });
        }
        return;
      }

      let questions = [];
      if (questionsText && questionsText.trim()) {
        questions = parseQuestionsFromText(questionsText);
      }
      if (questions.length === 0) {
        questions = DEFAULT_QUESTION_BANKS[bankPreset] || DEFAULT_QUESTION_BANKS.aritmetica;
      }

      const engine = new TournamentEngine({
        title: title || "Torneio de Matemática",
        questions,
        timeLimitSeconds: timeLimitSeconds !== undefined ? Number(timeLimitSeconds) : 90
      });

      // Se o professor forneceu alunos iniciais, adiciona. Se não, começa vazio!
      if (Array.isArray(playersList) && playersList.length > 0) {
        engine.addPlayersBatch(playersList);
      }

      activeTournaments.set(engine.code, engine);
      saveTournamentsToDisk();

      currentTournamentCode = engine.code;
      currentRole = "professor";
      socket.join(engine.code);
      socket.join(`${engine.code}_professor`);

      if (typeof callback === "function") {
        callback({
          success: true,
          code: engine.code,
          view: engine.getProfessorView()
        });
      }

      io.to(engine.code).emit("tournament_updated", engine.getState());
    } catch (err) {
      if (typeof callback === "function") {
        callback({ success: false, error: err.message });
      }
    }
  });

  // PROFESSOR: Reconectar a um torneio existente
  socket.on("reconnect_professor", (data, callback) => {
    try {
      const { code, password } = data || {};

      if (password !== PROFESSOR_PASSWORD) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Senha incorreta." });
        }
        return;
      }

      let engine = null;
      if (code) {
        engine = activeTournaments.get(code.toUpperCase().trim());
      } else if (activeTournaments.size > 0) {
        const keys = Array.from(activeTournaments.keys());
        engine = activeTournaments.get(keys[keys.length - 1]);
      }

      if (!engine) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Nenhum torneio em andamento encontrado." });
        }
        return;
      }

      currentTournamentCode = engine.code;
      currentRole = "professor";
      socket.join(engine.code);
      socket.join(`${engine.code}_professor`);

      if (typeof callback === "function") {
        callback({
          success: true,
          code: engine.code,
          view: engine.getProfessorView()
        });
      }
    } catch (err) {
      if (typeof callback === "function") {
        callback({ success: false, error: err.message });
      }
    }
  });

  // ESTUDANTE / PROFESSOR: Entrar no torneio
  socket.on("join_tournament", (data, callback) => {
    try {
      const { code, role, studentName, studentId, password } = data || {};
      const cleanCode = (code || "").toUpperCase().trim();
      const engine = activeTournaments.get(cleanCode);

      if (!engine) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Torneio não encontrado. Verifique o código digitado." });
        }
        return;
      }

      currentTournamentCode = cleanCode;
      currentRole = role;
      socket.join(cleanCode);

      if (role === "professor") {
        if (password !== PROFESSOR_PASSWORD) {
          if (typeof callback === "function") {
            return callback({ success: false, error: "Senha de professor incorreta." });
          }
          return;
        }

        socket.join(`${cleanCode}_professor`);
        if (typeof callback === "function") {
          callback({
            success: true,
            view: engine.getProfessorView()
          });
        }
      } else {
        // Papel de Estudante: Permite entrada no Lobby antes ou durante
        let player = null;
        if (studentId) {
          player = engine.players.get(studentId);
        }
        if (!player && studentName) {
          player = engine.addPlayer(studentName);
          saveTournamentsToDisk();
        }

        if (!player) {
          if (typeof callback === "function") {
            return callback({ success: false, error: "Estudante não encontrado." });
          }
          return;
        }

        currentStudentId = player.id;
        socket.join(`${cleanCode}_student_${player.id}`);

        if (typeof callback === "function") {
          callback({
            success: true,
            playerId: player.id,
            studentView: engine.getStudentView(player.id)
          });
        }

        // Notifica o professor do novo aluno conectado no Lobby
        io.to(`${cleanCode}_professor`).emit("professor_view_updated", engine.getProfessorView());
        io.to(cleanCode).emit("player_joined_lobby", {
          id: player.id,
          name: player.name,
          totalPlayers: engine.players.size
        });
      }
    } catch (err) {
      if (typeof callback === "function") {
        callback({ success: false, error: err.message });
      }
    }
  });

  // PROFESSOR: Iniciar Torneio
  socket.on("start_tournament", (data, callback) => {
    const engine = activeTournaments.get(currentTournamentCode);
    if (!engine) return;

    try {
      if (engine.players.size < 2) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Aguarde pelo menos 2 estudantes entrarem na sala com o código para iniciar o torneio." });
        }
        return;
      }

      engine.startTournament();
      saveTournamentsToDisk();

      io.to(`${engine.code}_professor`).emit("professor_view_updated", engine.getProfessorView());

      // Notifica todos os estudantes com suas partidas geradas
      for (const player of engine.players.values()) {
        io.to(`${engine.code}_student_${player.id}`).emit("student_view_updated", engine.getStudentView(player.id));
      }

      io.to(engine.code).emit("tournament_started", engine.getState());

      if (typeof callback === "function") callback({ success: true });
    } catch (err) {
      if (typeof callback === "function") callback({ success: false, error: err.message });
    }
  });

  // ESTUDANTE: Clicar em "PRONTO"
  socket.on("player_ready", (data, callback) => {
    const { code, playerId, matchId } = data || {};
    const tCode = code || currentTournamentCode;
    const engine = activeTournaments.get(tCode);
    if (!engine) {
      if (typeof callback === "function") callback({ success: false, error: "Torneio não ativo." });
      return;
    }

    const pId = playerId || currentStudentId;
    const res = engine.setPlayerReady(pId, matchId);
    saveTournamentsToDisk();

    if (typeof callback === "function") callback(res);

    const match = engine.allMatches.get(matchId);
    if (!match) return;

    io.to(`${tCode}_student_${match.player1.id}`).emit("student_view_updated", engine.getStudentView(match.player1.id));
    io.to(`${tCode}_student_${match.player2.id}`).emit("student_view_updated", engine.getStudentView(match.player2.id));
    io.to(`${tCode}_professor`).emit("professor_view_updated", engine.getProfessorView());

    // Se ambos apertaram Pronto -> Countdown de 3 segundos
    if (res.bothReady) {
      io.to(`${tCode}_student_${match.player1.id}`).emit("countdown_started", { seconds: 3 });
      io.to(`${tCode}_student_${match.player2.id}`).emit("countdown_started", { seconds: 3 });

      setTimeout(() => {
        engine.startMatchQuestion(matchId);
        saveTournamentsToDisk();

        io.to(`${tCode}_student_${match.player1.id}`).emit("student_view_updated", engine.getStudentView(match.player1.id));
        io.to(`${tCode}_student_${match.player2.id}`).emit("student_view_updated", engine.getStudentView(match.player2.id));
        io.to(`${tCode}_student_${match.player1.id}`).emit("question_released", { timeLimit: match.timeLimitSeconds });
        io.to(`${tCode}_student_${match.player2.id}`).emit("question_released", { timeLimit: match.timeLimitSeconds });
        io.to(`${tCode}_professor`).emit("professor_view_updated", engine.getProfessorView());
      }, 3000);
    }
  });

  // ANTI-TRAPAÇA: Troca de aba
  socket.on("cheat_detected", (data, callback) => {
    const { code, playerId, matchId, reason } = data || {};
    const tCode = code || currentTournamentCode;
    const engine = activeTournaments.get(tCode);
    if (!engine) return;

    const pId = playerId || currentStudentId;
    const res = engine.disqualifyPlayer(pId, matchId, reason || "Troca de aba detectada durante o duelo");
    saveTournamentsToDisk();

    if (typeof callback === "function") callback(res);

    if (res && res.success) {
      io.to(`${tCode}_student_${res.loserId}`).emit("disqualified_alert", {
        reason: res.reason,
        message: "🚨 DESCLASSIFICADO! Você saiu da tela da partida durante o cálculo."
      });

      io.to(`${tCode}_student_${res.winnerId}`).emit("opponent_disqualified_alert", {
        message: "🏆 O oponente foi desclassificado por mudar de aba! Você venceu a partida!"
      });

      for (const p of engine.players.values()) {
        io.to(`${tCode}_student_${p.id}`).emit("student_view_updated", engine.getStudentView(p.id));
      }
      io.to(`${tCode}_professor`).emit("professor_view_updated", engine.getProfessorView());
    }
  });

  // ESTUDANTE: Enviar Resposta
  socket.on("submit_answer", (data, callback) => {
    const { code, playerId, matchId, answer } = data || {};
    const tCode = code || currentTournamentCode;
    const engine = activeTournaments.get(tCode);
    if (!engine) {
      if (typeof callback === "function") callback({ success: false, error: "Torneio não ativo." });
      return;
    }

    const pId = playerId || currentStudentId;
    const result = engine.submitAnswer(pId, matchId, answer);
    saveTournamentsToDisk();

    if (typeof callback === "function") callback(result);

    const match = engine.allMatches.get(matchId);
    if (match) {
      io.to(`${tCode}_student_${match.player1.id}`).emit("student_view_updated", engine.getStudentView(match.player1.id));
      io.to(`${tCode}_student_${match.player2.id}`).emit("student_view_updated", engine.getStudentView(match.player2.id));

      if (result.event === "HINT_UNLOCKED") {
        io.to(`${tCode}_student_${match.player1.id}`).emit("hint_unlocked", { hint: match.question.hint });
        io.to(`${tCode}_student_${match.player2.id}`).emit("hint_unlocked", { hint: match.question.hint });
      } else if (!result.matchFinished && result.newQuestion) {
        const roundData = {
          message: result.message,
          question: match.question.question,
          newQuestion: match.question.question,
          p1Score: result.p1Score,
          p2Score: result.p2Score
        };
        io.to(`${tCode}_student_${match.player1.id}`).emit("round_scored", roundData);
        io.to(`${tCode}_student_${match.player2.id}`).emit("round_scored", roundData);
        io.to(`${tCode}_student_${match.player1.id}`).emit("tie_occurred", roundData);
        io.to(`${tCode}_student_${match.player2.id}`).emit("tie_occurred", roundData);
      }
    }

    // Atualiza a visão de todos os alunos e do professor
    for (const p of engine.players.values()) {
      io.to(`${tCode}_student_${p.id}`).emit("student_view_updated", engine.getStudentView(p.id));
    }
    io.to(`${tCode}_professor`).emit("professor_view_updated", engine.getProfessorView());
  });

  // PROFESSOR: Simular jogadas de bots
  socket.on("simulate_match_step", (data, callback) => {
    const engine = activeTournaments.get(currentTournamentCode);
    if (!engine) return;

    const { matchId } = data || {};
    const match = engine.allMatches.get(matchId);
    if (!match || match.status !== "ACTIVE") {
      if (typeof callback === "function") callback({ success: false, error: "Partida inválida" });
      return;
    }

    match.player1.isReady = true;
    match.player2.isReady = true;
    match.bothReady = true;
    match.questionVisible = true;
    match.startedAtQuestion = Date.now();

    const p1Answer = Math.random() > 0.3 ? match.question.answer : "999";
    const p2Answer = Math.random() > 0.4 ? match.question.answer : "888";

    engine.submitAnswer(match.player1.id, match.id, p1Answer);
    const res = engine.submitAnswer(match.player2.id, match.id, p2Answer);
    saveTournamentsToDisk();

    for (const p of engine.players.values()) {
      io.to(`${engine.code}_student_${p.id}`).emit("student_view_updated", engine.getStudentView(p.id));
    }
    io.to(`${engine.code}_professor`).emit("professor_view_updated", engine.getProfessorView());

    if (typeof callback === "function") callback({ success: true, result: res });
  });

  // PROFESSOR: Simular rodada inteira
  socket.on("simulate_entire_round", (data, callback) => {
    const engine = activeTournaments.get(currentTournamentCode);
    if (!engine) return;

    const activeMatches = Array.from(engine.allMatches.values()).filter(m => m.status === "ACTIVE");
    for (const m of activeMatches) {
      m.player1.isReady = true;
      m.player2.isReady = true;
      m.bothReady = true;
      m.questionVisible = true;
      m.startedAtQuestion = Date.now();

      const winner = Math.random() > 0.5 ? m.player1.id : m.player2.id;
      const loser = winner === m.player1.id ? m.player2.id : m.player1.id;

      engine.submitAnswer(winner, m.id, m.question.answer);
      engine.submitAnswer(loser, m.id, "000");
    }

    saveTournamentsToDisk();

    for (const p of engine.players.values()) {
      io.to(`${engine.code}_student_${p.id}`).emit("student_view_updated", engine.getStudentView(p.id));
    }
    io.to(`${engine.code}_professor`).emit("professor_view_updated", engine.getProfessorView());

    if (typeof callback === "function") callback({ success: true });
  });

  socket.on("get_student_stats", (data, callback) => {
    const code = data?.code || currentTournamentCode;
    const engine = activeTournaments.get(code);
    if (!engine) {
      if (typeof callback === "function") callback({ success: false, error: "Torneio não encontrado" });
      return;
    }
    if (typeof callback === "function") {
      callback({
        success: true,
        stats: engine.getIndividualStudentStats(),
        podium: engine.getProfessorView().podium
      });
    }
  });
});

server.listen(PORT, () => {
  const ip = getLocalNetworkIp();
  console.log("==================================================");
  console.log("🏆 SISTEMA DE TORNEIO DE MATEMÁTICA ATIVO!");
  console.log(`📡 Local:   http://localhost:${PORT}`);
  console.log(`📱 Na Rede: http://${ip}:${PORT}`);
  console.log("🔒 Senha do Professor: josenetomat");
  console.log("🛡️  Anti-Trapaça: Detecção de Troca de Aba Ativada");
  console.log("==================================================");
});
