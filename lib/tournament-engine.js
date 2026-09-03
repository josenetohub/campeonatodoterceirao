/**
 * Tournament Engine
 * Chaveamento com:
 * - Divisão inteligente em ~7 estudantes por chave
 * - Séries dinâmicas (A, B, C, D, E, F, G...)
 * - Entrada opcional de alunos na criação com Lobby em tempo real
 * - Progressão e rebaixamento sincronizados (vencedores jogam entre si até a final; perdedores vão juntos para a série seguinte)
 * - Botão "Pronto" + Countdown 3s
 * - Temporizador por duelo
 * - Anti-trapaça (desclassificação por troca de aba)
 */

const { validateAnswer } = require("./question-parser");

const SERIES_ALPHABET = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const SERIES_THEMES = {
  A: { name: "Série A", label: "Ouro", border: "border-t-amber-500", text: "text-amber-400", badge: "badge-serie-a", icon: "fa-trophy" },
  B: { name: "Série B", label: "Prata", border: "border-t-blue-500", text: "text-blue-400", badge: "badge-serie-b", icon: "fa-shield-halved" },
  C: { name: "Série C", label: "Bronze", border: "border-t-emerald-500", text: "text-emerald-400", badge: "badge-serie-c", icon: "fa-medal" },
  D: { name: "Série D", label: "Roxa", border: "border-t-purple-500", text: "text-purple-400", badge: "bg-purple-600 text-white font-bold", icon: "fa-star" },
  E: { name: "Série E", label: "Laranja", border: "border-t-orange-500", text: "text-orange-400", badge: "bg-orange-600 text-white font-bold", icon: "fa-bolt" },
  F: { name: "Série F", label: "Ciano", border: "border-t-cyan-500", text: "text-cyan-400", badge: "bg-cyan-600 text-white font-bold", icon: "fa-gem" },
  G: { name: "Série G", label: "Rosa", border: "border-t-pink-500", text: "text-pink-400", badge: "bg-pink-600 text-white font-bold", icon: "fa-fire" }
};

class TournamentEngine {
  constructor(options = {}) {
    this.id = options.id || `torneio_${Date.now()}`;
    this.code = options.code || this.generateTournamentCode();
    this.title = options.title || "Torneio de Matemática";
    this.createdAt = options.createdAt || new Date();
    this.status = options.status || "SETUP"; // SETUP, RUNNING, FINISHED
    this.timeLimitSeconds = options.timeLimitSeconds !== undefined ? Number(options.timeLimitSeconds) : 90;

    this.players = new Map(); // id -> Player
    this.questions = options.questions || [];
    this.currentQuestionIndex = options.currentQuestionIndex || 0;

    // Estrutura de Séries Dinâmicas
    this.series = options.series || {};
    this.ensureSeriesExists("A");
    this.ensureSeriesExists("B");
    this.ensureSeriesExists("C");

    // Histórico geral de partidas
    this.allMatches = new Map();
    if (options.allMatches) {
      if (Array.isArray(options.allMatches)) {
        options.allMatches.forEach(m => this.allMatches.set(m.id, m));
      } else if (typeof options.allMatches === "object") {
        Object.entries(options.allMatches).forEach(([k, v]) => this.allMatches.set(k, v));
      }
    }

    if (options.players) {
      if (Array.isArray(options.players)) {
        options.players.forEach(p => this.players.set(p.id, p));
      }
    }
  }

  ensureSeriesExists(seriesKey) {
    if (!this.series[seriesKey]) {
      const theme = SERIES_THEMES[seriesKey] || {
        name: `Série ${seriesKey}`,
        label: `Nível ${seriesKey}`,
        border: "border-t-slate-500",
        text: "text-slate-300",
        badge: "bg-slate-700 text-white font-bold",
        icon: "fa-award"
      };

      this.series[seriesKey] = {
        key: seriesKey,
        name: theme.name,
        theme,
        level: SERIES_ALPHABET.indexOf(seriesKey) + 1,
        matches: [],
        rounds: [],
        champion: null,
        active: true
      };
    }
    return this.series[seriesKey];
  }

  generateTournamentCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "MAT-";
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  addPlayer(name, isBot = false) {
    const cleanName = String(name).trim();
    if (!cleanName) return null;

    for (const p of this.players.values()) {
      if (p.name.toLowerCase() === cleanName.toLowerCase()) {
        return p;
      }
    }

    const id = `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const avatarIndex = (this.players.size % 8) + 1;

    const player = {
      id,
      name: cleanName,
      isBot,
      avatar: `avatar_${avatarIndex}`,
      currentSeries: "A",
      status: "WAITING",
      activeMatchId: null,
      stats: {
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        totalAttempts: 0,
        firstAttemptSuccess: 0,
        secondAttemptSuccess: 0,
        hintsReceived: 0,
        tieBreakersPlayed: 0,
        disqualifications: 0,
        totalResponseTimeMs: 0,
        history: []
      }
    };

    this.players.set(id, player);
    return player;
  }

  addPlayersBatch(namesList) {
    const added = [];
    for (const name of namesList) {
      const p = this.addPlayer(name);
      if (p) added.push(p);
    }
    return added;
  }

  getNextQuestion() {
    if (this.questions.length === 0) {
      return {
        id: "default_q",
        question: "Quanto é 7 \\times 8?",
        answer: "56",
        hint: "Pense em 7 x 7 = 49 e adicione mais 7."
      };
    }
    const q = this.questions[this.currentQuestionIndex % this.questions.length];
    this.currentQuestionIndex++;
    return q;
  }

  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Inicia o Torneio:
   * Aplica a regra de ~7 estudantes por chaveamento.
   * Se N <= 8: Todos iniciam na Série A; perdedores vão para a Série B; perdedores de B vão para C.
   * Se N > 8: Divide em blocos de ~7 (ex: 14 alunos -> Série A com 7 e Série B com 7; 21 alunos -> Série A, B e C; 28 alunos -> Série A, B, C, D).
   */
  startTournament() {
    const playerList = Array.from(this.players.values());
    if (playerList.length < 2) {
      throw new Error("São necessários no mínimo 2 estudantes conectados para iniciar o torneio.");
    }

    this.status = "RUNNING";
    const shuffled = this.shuffle(playerList);
    const N = shuffled.length;

    if (N <= 8) {
      // Todos começam na Série A
      this.ensureSeriesExists("A");
      this.ensureSeriesExists("B");
      this.ensureSeriesExists("C");
      shuffled.forEach(p => { p.currentSeries = "A"; });
      this.createSeriesRound("A", shuffled, 1);
    } else {
      // Mais de 8 alunos: divide em séries de ~7 alunos (Série A, B, C, D, E, F...)
      const numSeries = Math.ceil(N / 7);
      const playersPerSeries = Math.ceil(N / numSeries);

      for (let sIdx = 0; sIdx < numSeries; sIdx++) {
        const seriesKey = SERIES_ALPHABET[sIdx] || `S${sIdx + 1}`;
        this.ensureSeriesExists(seriesKey);
        // Também garante que a série seguinte exista para o rebaixamento
        const nextKey = SERIES_ALPHABET[sIdx + 1];
        if (nextKey) this.ensureSeriesExists(nextKey);

        const start = sIdx * playersPerSeries;
        const end = Math.min(N, start + playersPerSeries);
        const seriesGroup = shuffled.slice(start, end);

        if (seriesGroup.length > 0) {
          seriesGroup.forEach(p => { p.currentSeries = seriesKey; });
          this.createSeriesRound(seriesKey, seriesGroup, 1);
        }
      }
    }

    return this.getState();
  }

  createSeriesRound(seriesKey, participants, roundNumber) {
    const seriesObj = this.ensureSeriesExists(seriesKey);
    if (!participants || participants.length === 0) return [];

    // Se sobrou apenas 1 jogador nesta série, ele é o Campeão da série!
    if (participants.length === 1) {
      const champ = participants[0];
      champ.status = "CHAMPION";
      seriesObj.champion = {
        id: champ.id,
        name: champ.name,
        avatar: champ.avatar,
        series: seriesKey
      };
      this.checkTournamentCompletion();
      return [];
    }

    const matches = [];
    const totalRoundsEstimate = Math.ceil(Math.log2(participants.length)) || 1;

    for (let i = 0; i < participants.length; i += 2) {
      // Se ímpar, o último ganha bye e espera a próxima fase
      if (i + 1 >= participants.length) {
        const luckyPlayer = participants[i];
        luckyPlayer.status = "WAITING";
        luckyPlayer.activeMatchId = null;
        continue;
      }

      const p1 = participants[i];
      const p2 = participants[i + 1];
      const question = this.getNextQuestion();

      const matchId = `match_${seriesKey}_r${roundNumber}_${i / 2}_${Date.now()}`;
      const match = {
        id: matchId,
        series: seriesKey,
        round: roundNumber,
        totalRounds: totalRoundsEstimate,
        timeLimitSeconds: this.timeLimitSeconds,
        player1: {
          id: p1.id,
          name: p1.name,
          avatar: p1.avatar,
          isReady: false,
          attempts: [],
          currentTurnAnswer: null,
          hasSubmittedTurn: false
        },
        player2: {
          id: p2.id,
          name: p2.name,
          avatar: p2.avatar,
          isReady: false,
          attempts: [],
          currentTurnAnswer: null,
          hasSubmittedTurn: false
        },
        question: {
          id: question.id,
          question: question.question,
          answer: question.answer,
          hint: question.hint
        },
        bothReady: false,
        isCountingDown: false,
        questionVisible: false,
        startedAtQuestion: null,
        hintUnlocked: false,
        attemptNumber: 1,
        isTiebreaker: false,
        status: "ACTIVE",
        winnerId: null,
        loserId: null,
        disqualifiedId: null,
        disqualifyReason: null,
        lastEvent: "WAITING_READY",
        lastMessage: "Aguardando ambos apertarem 'Pronto'.",
        startedAt: Date.now(),
        finishedAt: null
      };

      p1.status = "IN_MATCH";
      p1.currentSeries = seriesKey;
      p1.activeMatchId = matchId;

      p2.status = "IN_MATCH";
      p2.currentSeries = seriesKey;
      p2.activeMatchId = matchId;

      matches.push(match);
      this.allMatches.set(matchId, match);
    }

    seriesObj.matches.push(...matches);
    seriesObj.rounds.push({
      roundNumber,
      matches: matches.map(m => m.id)
    });

    return matches;
  }

  setPlayerReady(playerId, matchId) {
    const match = this.allMatches.get(matchId);
    if (!match || match.status !== "ACTIVE") {
      return { success: false, error: "Partida não encontrada." };
    }

    if (match.player1.id === playerId) {
      match.player1.isReady = true;
    } else if (match.player2.id === playerId) {
      match.player2.isReady = true;
    } else {
      return { success: false, error: "Jogador não pertence a esta partida." };
    }

    if (match.player1.isReady && match.player2.isReady) {
      match.bothReady = true;
      match.isCountingDown = true;
      match.lastEvent = "COUNTDOWN_STARTED";
      match.lastMessage = "Ambos prontos! Contagem regressiva de 3 segundos!";

      return {
        success: true,
        bothReady: true,
        countdownSeconds: 3,
        matchId: match.id
      };
    }

    match.lastEvent = "PLAYER_READY";
    match.lastMessage = "Aguardando o outro estudante apertar 'Pronto'.";

    return {
      success: true,
      bothReady: false,
      waitingOpponent: true,
      matchId: match.id
    };
  }

  startMatchQuestion(matchId) {
    const match = this.allMatches.get(matchId);
    if (!match || match.status !== "ACTIVE") return;

    match.questionVisible = true;
    match.isCountingDown = false;
    match.startedAtQuestion = Date.now();
    match.lastEvent = "QUESTION_VISIBLE";
    match.lastMessage = "Pergunta liberada! Valendo o cálculo!";
    return match;
  }

  disqualifyPlayer(playerId, matchId, reason = "Troca de aba detectada durante o duelo") {
    const match = this.allMatches.get(matchId);
    if (!match || match.status !== "ACTIVE") {
      return { success: false, error: "Partida inválida ou já finalizada." };
    }

    const isP1 = match.player1.id === playerId;
    const isP2 = match.player2.id === playerId;
    if (!isP1 && !isP2) {
      return { success: false, error: "Jogador não pertence a esta partida." };
    }

    const cheater = isP1 ? this.players.get(match.player1.id) : this.players.get(match.player2.id);
    const honestOpponent = isP1 ? this.players.get(match.player2.id) : this.players.get(match.player1.id);

    cheater.stats.disqualifications = (cheater.stats.disqualifications || 0) + 1;

    match.disqualifiedId = cheater.id;
    match.disqualifyReason = reason;
    match.lastEvent = "DISQUALIFIED_TAB_SWITCH";
    match.lastMessage = `🚨 ${cheater.name} foi desclassificado por mudar de aba durante a partida!`;

    this.finishMatch(match, honestOpponent, cheater, "DISQUALIFIED_TAB_SWITCH");

    return {
      success: true,
      winnerId: honestOpponent.id,
      loserId: cheater.id,
      reason,
      matchId: match.id
    };
  }

  submitAnswer(playerId, matchId, studentAnswer) {
    const match = this.allMatches.get(matchId);
    if (!match || match.status !== "ACTIVE") {
      return { success: false, error: "Partida não encontrada ou já finalizada." };
    }

    if (!match.questionVisible) {
      return { success: false, error: "Aguarde a contagem regressiva para responder." };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: "Jogador não encontrado." };
    }

    const isPlayer1 = match.player1.id === playerId;
    const isPlayer2 = match.player2.id === playerId;
    if (!isPlayer1 && !isPlayer2) {
      return { success: false, error: "Você não pertence a esta partida." };
    }

    const currentPlayerData = isPlayer1 ? match.player1 : match.player2;
    const opponentData = isPlayer1 ? match.player2 : match.player1;
    const opponentPlayer = this.players.get(opponentData.id);

    if (currentPlayerData.hasSubmittedTurn) {
      return {
        success: true,
        waitingOpponent: true,
        message: "Sua resposta já foi registrada. Aguardando o oponente responder..."
      };
    }

    currentPlayerData.currentTurnAnswer = studentAnswer;
    currentPlayerData.hasSubmittedTurn = true;
    player.stats.totalAttempts++;

    if (!opponentData.hasSubmittedTurn) {
      match.lastEvent = "WAITING_OPPONENT";
      match.lastMessage = `${player.name} enviou a resposta. Aguardando ${opponentPlayer.name}...`;

      return {
        success: true,
        waitingOpponent: true,
        event: "WAITING_OPPONENT",
        message: "Resposta registrada! Aguardando seu oponente responder para a IA comparar..."
      };
    }

    // AMBOS RESPONDERAM!
    const p1Ans = match.player1.currentTurnAnswer;
    const p2Ans = match.player2.currentTurnAnswer;
    const isP1Correct = validateAnswer(p1Ans, match.question.answer);
    const isP2Correct = validateAnswer(p2Ans, match.question.answer);

    const now = Date.now();
    match.player1.attempts.push({
      attemptNumber: match.attemptNumber,
      answer: p1Ans,
      isCorrect: isP1Correct,
      timestamp: now,
      hintUsed: match.hintUnlocked
    });
    match.player2.attempts.push({
      attemptNumber: match.attemptNumber,
      answer: p2Ans,
      isCorrect: isP2Correct,
      timestamp: now,
      hintUsed: match.hintUnlocked
    });

    match.player1.hasSubmittedTurn = false;
    match.player2.hasSubmittedTurn = false;
    match.player1.currentTurnAnswer = null;
    match.player2.currentTurnAnswer = null;

    const p1 = this.players.get(match.player1.id);
    const p2 = this.players.get(match.player2.id);

    // 1: P1 ACERTOU e P2 ERROU
    if (isP1Correct && !isP2Correct) {
      if (match.attemptNumber === 1) p1.stats.firstAttemptSuccess++;
      else p1.stats.secondAttemptSuccess++;

      match.lastEvent = "MATCH_WON";
      match.lastMessage = `${p1.name} acertou a questão e venceu o duelo!`;
      this.finishMatch(match, p1, p2, "CORRECT_ANSWER");

      return {
        success: true,
        evaluated: true,
        event: "MATCH_WON",
        winnerId: p1.id,
        isCorrect: isPlayer1,
        message: `${p1.name} acertou e venceu o duelo!`
      };
    }

    // 2: P2 ACERTOU e P1 ERROU
    if (!isP1Correct && isP2Correct) {
      if (match.attemptNumber === 1) p2.stats.firstAttemptSuccess++;
      else p2.stats.secondAttemptSuccess++;

      match.lastEvent = "MATCH_WON";
      match.lastMessage = `${p2.name} acertou a questão e venceu o duelo!`;
      this.finishMatch(match, p2, p1, "CORRECT_ANSWER");

      return {
        success: true,
        evaluated: true,
        event: "MATCH_WON",
        winnerId: p2.id,
        isCorrect: isPlayer2,
        message: `${p2.name} acertou e venceu o duelo!`
      };
    }

    // 3: AMBOS ACERTARAM! EMPATE -> NOVA QUESTÃO
    if (isP1Correct && isP2Correct) {
      p1.stats.firstAttemptSuccess++;
      p2.stats.firstAttemptSuccess++;
      p1.stats.tieBreakersPlayed++;
      p2.stats.tieBreakersPlayed++;

      const nextQ = this.getNextQuestion();
      match.question = {
        id: nextQ.id,
        question: nextQ.question,
        answer: nextQ.answer,
        hint: nextQ.hint
      };
      match.attemptNumber = 1;
      match.hintUnlocked = false;
      match.isTiebreaker = true;
      match.startedAtQuestion = Date.now();
      match.lastEvent = "TIE_BOTH_CORRECT";
      match.lastMessage = "Incrível! Ambos acertaram! Nova pergunta gerada para desempate!";

      return {
        success: true,
        evaluated: true,
        isTie: true,
        event: "TIE_BOTH_CORRECT",
        newQuestion: match.question.question,
        message: "Ambos acertaram! O duelo empatou. A IA gerou uma nova pergunta para desempatar!"
      };
    }

    // 4: AMBOS ERRARAM!
    if (!isP1Correct && !isP2Correct) {
      if (match.attemptNumber === 1) {
        match.hintUnlocked = true;
        match.attemptNumber = 2;
        p1.stats.hintsReceived++;
        p2.stats.hintsReceived++;

        match.lastEvent = "HINT_UNLOCKED";
        match.lastMessage = "Ambos erraram na 1ª tentativa! A Dica de Resolução foi desbloqueada para a 2ª tentativa.";

        return {
          success: true,
          evaluated: true,
          event: "HINT_UNLOCKED",
          hintUnlocked: true,
          hint: match.question.hint,
          message: "Ambos erraram na 1ª tentativa! A Dica de Resolução foi revelada. Façam suas contas para a 2ª tentativa!"
        };
      } else {
        p1.stats.tieBreakersPlayed++;
        p2.stats.tieBreakersPlayed++;

        const nextQ = this.getNextQuestion();
        match.question = {
          id: nextQ.id,
          question: nextQ.question,
          answer: nextQ.answer,
          hint: nextQ.hint
        };
        match.attemptNumber = 1;
        match.hintUnlocked = false;
        match.isTiebreaker = true;
        match.startedAtQuestion = Date.now();
        match.lastEvent = "TIE_BOTH_FAILED";
        match.lastMessage = "Ambos erraram na 2ª tentativa. Nova pergunta de desempate gerada!";

        return {
          success: true,
          evaluated: true,
          isTie: true,
          event: "TIE_BOTH_FAILED",
          newQuestion: match.question.question,
          message: "Ambos erraram na 2ª tentativa. A IA gerou uma nova questão de desempate!"
        };
      }
    }
  }

  finishMatch(match, winner, loser, reason = "NORMAL") {
    match.status = "FINISHED";
    match.winnerId = winner.id;
    match.loserId = loser.id;
    match.finishedAt = Date.now();
    match.finishReason = reason;

    winner.stats.matchesPlayed++;
    winner.stats.matchesWon++;
    winner.status = "WAITING";
    winner.activeMatchId = null;
    winner.stats.history.push({
      matchId: match.id,
      series: match.series,
      opponent: loser.name,
      won: true,
      attempts: match.player1.id === winner.id ? match.player1.attempts : match.player2.attempts,
      question: match.question.question,
      reason
    });

    loser.stats.matchesPlayed++;
    loser.stats.matchesLost++;
    loser.activeMatchId = null;
    loser.stats.history.push({
      matchId: match.id,
      series: match.series,
      opponent: winner.name,
      won: false,
      attempts: match.player1.id === loser.id ? match.player1.attempts : match.player2.attempts,
      question: match.question.question,
      reason
    });

    // DETERMINA A PRÓXIMA SÉRIE DO PERDEDOR (A -> B -> C -> D -> E ...)
    const currentIdx = SERIES_ALPHABET.indexOf(match.series);
    if (currentIdx >= 0 && currentIdx < SERIES_ALPHABET.length - 1) {
      const nextSeriesKey = SERIES_ALPHABET[currentIdx + 1];
      loser.currentSeries = nextSeriesKey;
      loser.status = "RELEGATED";
      this.ensureSeriesExists(nextSeriesKey);
    } else {
      loser.status = "FINISHED";
    }

    // VERIFICA SE TODA A RODADA DESTA SÉRIE TERMINOU
    this.checkSeriesRoundCompletion(match.series, match.round);
    this.checkTournamentCompletion();
  }

  /**
   * Verifica se todas as partidas da Rodada `roundNumber` da série `seriesKey` foram concluídas.
   * Quando a rodada termina:
   * 1. Os VENCEDORES avançam para a próxima rodada da MESMA série e jogam entre si até a final!
   * 2. Os PERDEDORES são enviados juntos para a série seguinte (A -> B, B -> C, C -> D) para formarem uma rodada completa!
   */
  checkSeriesRoundCompletion(seriesKey, roundNumber) {
    const seriesObj = this.series[seriesKey];
    if (!seriesObj) return;

    const roundData = seriesObj.rounds.find(r => r.roundNumber === roundNumber);
    if (!roundData) return;

    const roundMatches = roundData.matches.map(id => this.allMatches.get(id)).filter(Boolean);
    const allMatchesFinished = roundMatches.every(m => m.status === "FINISHED");

    // Se ainda há partidas em andamento nesta rodada, aguarda
    if (!allMatchesFinished) return;

    // 1. PROCESSA OS VENCEDORES DA SÉRIE ATUAL
    const winners = roundMatches.map(m => this.players.get(m.winnerId)).filter(Boolean);

    // Adiciona eventuais jogadores que estavam de "bye" (esperando) nesta série
    const waitingPlayersInSeries = Array.from(this.players.values()).filter(p =>
      p.currentSeries === seriesKey && p.status === "WAITING" && !winners.some(w => w.id === p.id)
    );
    const nextRoundParticipants = [...winners, ...waitingPlayersInSeries];

    if (nextRoundParticipants.length > 1) {
      // Vencedores disputam entre si a próxima fase (Semifinal ou Final)!
      const nextRoundNum = roundNumber + 1;
      this.createSeriesRound(seriesKey, nextRoundParticipants, nextRoundNum);
    } else if (nextRoundParticipants.length === 1) {
      // Temos o Campeão Oficial desta Série!
      const champ = nextRoundParticipants[0];
      champ.status = "CHAMPION";
      seriesObj.champion = {
        id: champ.id,
        name: champ.name,
        avatar: champ.avatar,
        series: seriesKey
      };
    }

    // 2. PROCESSA OS PERDEDORES PARA REBAIXAMENTO
    const currentIdx = SERIES_ALPHABET.indexOf(seriesKey);
    if (currentIdx >= 0 && currentIdx < SERIES_ALPHABET.length - 1) {
      const nextSeriesKey = SERIES_ALPHABET[currentIdx + 1];
      this.ensureSeriesExists(nextSeriesKey);

      // Coleta todos os alunos rebaixados para a série seguinte que estão livres para jogar
      const relegatedPlayers = Array.from(this.players.values()).filter(p =>
        p.currentSeries === nextSeriesKey && (p.status === "RELEGATED" || p.status === "WAITING") && !p.activeMatchId
      );

      // Se temos pelo menos 2 jogadores rebaixados para esta série, cria a rodada entre eles!
      if (relegatedPlayers.length >= 2) {
        const nextSeriesObj = this.series[nextSeriesKey];
        const nextRoundNum = nextSeriesObj.rounds.length + 1;
        this.createSeriesRound(nextSeriesKey, relegatedPlayers, nextRoundNum);
      }
    }
  }

  checkTournamentCompletion() {
    const activeMatches = Array.from(this.allMatches.values()).filter(m => m.status === "ACTIVE");
    const activePlayers = Array.from(this.players.values()).filter(p => p.status === "IN_MATCH");

    if (activeMatches.length === 0 && activePlayers.length === 0) {
      // Para cada série que ainda não tem campeão, se sobrou apenas 1 jogador livre nela, coroa como campeão!
      for (const [key, seriesObj] of Object.entries(this.series)) {
        if (!seriesObj.champion) {
          const playersInSeries = Array.from(this.players.values()).filter(p => p.currentSeries === key);
          if (playersInSeries.length === 1) {
            const p = playersInSeries[0];
            p.status = "CHAMPION";
            seriesObj.champion = { id: p.id, name: p.name, avatar: p.avatar, series: key };
          }
        }
      }
      this.status = "FINISHED";
    }
  }

  getStudentView(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    const seriesObj = this.series[player.currentSeries];
    const seriesName = seriesObj?.name || `Série ${player.currentSeries}`;
    const seriesTheme = seriesObj?.theme || SERIES_THEMES[player.currentSeries] || null;

    if (!player.activeMatchId) {
      return {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        currentSeries: player.currentSeries,
        seriesName,
        seriesTheme,
        status: player.status,
        isChampion: player.status === "CHAMPION",
        inMatch: false,
        tournamentStatus: this.status,
        message: this.getWaitingMessage(player)
      };
    }

    const match = this.allMatches.get(player.activeMatchId);
    if (!match) {
      return {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        currentSeries: player.currentSeries,
        seriesName,
        seriesTheme,
        status: player.status,
        isChampion: player.status === "CHAMPION",
        inMatch: false,
        tournamentStatus: this.status,
        message: "Aguardando próxima fase..."
      };
    }

    const isPlayer1 = match.player1.id === playerId;
    const myData = isPlayer1 ? match.player1 : match.player2;
    const opponentData = isPlayer1 ? match.player2 : match.player1;

    const matchesRemaining = Math.max(1, (match.totalRounds || 2) - match.round + 1);

    return {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      currentSeries: match.series,
      seriesName,
      seriesTheme,
      inMatch: true,
      tournamentStatus: this.status,
      matchId: match.id,
      round: match.round,
      isReady: myData.isReady,
      opponentIsReady: opponentData.isReady,
      bothReady: match.bothReady,
      isCountingDown: match.isCountingDown,
      questionVisible: match.questionVisible,
      timeLimitSeconds: match.timeLimitSeconds,
      startedAtQuestion: match.startedAtQuestion,
      disqualified: match.disqualifiedId === player.id,
      disqualifyReason: match.disqualifyReason,
      opponent: {
        name: opponentData.name,
        avatar: opponentData.avatar,
        isReady: opponentData.isReady,
        hasSubmittedTurn: opponentData.hasSubmittedTurn
      },
      gamesNeededToWin: matchesRemaining,
      motivationalGoal: `Faltam ${matchesRemaining} vitória${matchesRemaining > 1 ? "s" : ""} para conquistar o Troféu da ${seriesName}!`,
      question: {
        id: match.question.id,
        text: match.questionVisible ? match.question.question : "Aguardando início..."
      },
      hintUnlocked: match.hintUnlocked,
      hint: (match.hintUnlocked && match.questionVisible) ? match.question.hint : null,
      attemptNumber: match.attemptNumber,
      hasSubmittedTurn: myData.hasSubmittedTurn,
      lastEvent: match.lastEvent,
      lastMessage: match.lastMessage,
      isTiebreaker: match.isTiebreaker,
      myAttemptsCount: myData.attempts.length,
      myAttempts: myData.attempts.map(a => ({
        answer: a.answer,
        isCorrect: a.isCorrect,
        hintUsed: a.hintUsed
      }))
    };
  }

  getWaitingMessage(player) {
    if (this.status === "SETUP") {
      return "🟢 Você está conectado ao Lobby! Aguarde o professor dar a largada no torneio...";
    }
    if (player.status === "CHAMPION") {
      return `🏆 PARABÉNS! Você é o GRANDE CAMPEÃO da ${this.series[player.currentSeries]?.name || player.currentSeries}!`;
    }
    if (player.status === "RELEGATED") {
      return `🔄 Você está na disputa da ${this.series[player.currentSeries]?.name || player.currentSeries}! Aguarde o próximo adversário ser definido.`;
    }
    if (player.status === "FINISHED") {
      return "👏 Parabéns pela sua dedicação! O torneio chegou ao fim.";
    }
    return "⏳ Aguardando seu próximo adversário ou o início da rodada pelo professor...";
  }

  getProfessorView() {
    // Coleta todos os campeões de todas as séries existentes
    const podium = {};
    for (const [key, sObj] of Object.entries(this.series)) {
      if (sObj.champion) {
        podium[key] = sObj.champion;
      }
    }

    return {
      id: this.id,
      code: this.code,
      title: this.title,
      status: this.status,
      timeLimitSeconds: this.timeLimitSeconds,
      totalPlayers: this.players.size,
      players: Array.from(this.players.values()),
      series: this.series,
      seriesList: Object.values(this.series),
      matches: Array.from(this.allMatches.values()),
      podium
    };
  }

  getIndividualStudentStats() {
    const statsList = [];
    for (const player of this.players.values()) {
      const accuracy = player.stats.totalAttempts > 0
        ? Math.round(((player.stats.firstAttemptSuccess + player.stats.secondAttemptSuccess) / player.stats.totalAttempts) * 100)
        : 0;

      statsList.push({
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        currentSeries: player.currentSeries,
        isChampion: player.status === "CHAMPION",
        matchesPlayed: player.stats.matchesPlayed,
        matchesWon: player.stats.matchesWon,
        matchesLost: player.stats.matchesLost,
        winRate: player.stats.matchesPlayed > 0 ? Math.round((player.stats.matchesWon / player.stats.matchesPlayed) * 100) : 0,
        totalAttempts: player.stats.totalAttempts,
        firstAttemptSuccess: player.stats.firstAttemptSuccess,
        secondAttemptSuccess: player.stats.secondAttemptSuccess,
        hintsReceived: player.stats.hintsReceived,
        tieBreakersPlayed: player.stats.tieBreakersPlayed || 0,
        disqualifications: player.stats.disqualifications || 0,
        accuracyPercent: accuracy,
        matchHistory: player.stats.history
      });
    }

    return statsList.sort((a, b) => b.matchesWon - a.matchesWon || b.accuracyPercent - a.accuracyPercent);
  }

  getState() {
    return {
      id: this.id,
      code: this.code,
      status: this.status,
      timeLimitSeconds: this.timeLimitSeconds,
      playerCount: this.players.size
    };
  }

  toJSON() {
    return {
      id: this.id,
      code: this.code,
      title: this.title,
      createdAt: this.createdAt,
      status: this.status,
      timeLimitSeconds: this.timeLimitSeconds,
      currentQuestionIndex: this.currentQuestionIndex,
      questions: this.questions,
      series: this.series,
      players: Array.from(this.players.values()),
      allMatches: Array.from(this.allMatches.values())
    };
  }

  static fromJSON(data) {
    const engine = new TournamentEngine(data);
    return engine;
  }
}

module.exports = TournamentEngine;
