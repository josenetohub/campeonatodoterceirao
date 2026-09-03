/**
 * Testes Automatizados da Engine do Torneio
 * Foco na nova lógica:
 * 1. Criação sem alunos (opcional) e entrada dinâmica no Lobby
 * 2. Chaveamento de ~7 alunos por série
 * 3. Séries dinâmicas (A, B, C, D, E...)
 * 4. Correção do rebaixamento (Lucas vai para a Série C; vencedores da Série B jogam entre si a final)
 * 5. Botão "Pronto", timer e anti-trapaça
 */

const assert = require("assert");
const TournamentEngine = require("../lib/tournament-engine");
const { DEFAULT_QUESTION_BANKS } = require("../lib/question-parser");

console.log("🚀 Iniciando testes do Novo Chaveamento (7 alunos/chave, Séries Dinâmicas A-G e Rebaixamento)...\n");

// -------------------------------------------------------------
// TESTE 1: Criação com 0 alunos e entrada dinâmica no Lobby
// -------------------------------------------------------------
console.log("TESTE 1: Criação opcional sem alunos e Lobby em tempo real");
const engine = new TournamentEngine({
  title: "Torneio Teste",
  questions: DEFAULT_QUESTION_BANKS.aritmetica,
  timeLimitSeconds: 60
});
assert.strictEqual(engine.players.size, 0, "Torneio deve iniciar com 0 alunos");
assert.strictEqual(engine.status, "SETUP");

// Estudantes entram pelo código
const studentNames = [
  "Sofia Albuquerque",
  "Gabriel Ribeiro",
  "Laura Mendes",
  "Matheus Nogueira",
  "Beatriz Ferreira",
  "Pedro Henrique",
  "Larissa Carvalho",
  "Lucas Silveira"
];

studentNames.forEach(name => {
  const p = engine.addPlayer(name);
  assert.ok(p.id);
  assert.strictEqual(p.status, "WAITING");
});

assert.strictEqual(engine.players.size, 8, "8 alunos devem estar no Lobby");
console.log("✅ Criação sem alunos e entrada de 8 alunos no Lobby aprovada!");

// -------------------------------------------------------------
// TESTE 2: Início do Torneio com 8 alunos (Série A completa)
// -------------------------------------------------------------
console.log("\nTESTE 2: Chaveamento da Série A");
engine.startTournament();
assert.strictEqual(engine.status, "RUNNING");
assert.strictEqual(engine.series.A.matches.length, 4, "Série A deve ter 4 confrontos na 1ª rodada");

const matchesA = engine.series.A.matches;
console.log("✅ 4 confrontos gerados na Rodada 1 da Série A!");

// -------------------------------------------------------------
// TESTE 3: Conclusão da Rodada 1 da Série A e Rebaixamento para Série B
// -------------------------------------------------------------
console.log("\nTESTE 3: Rebaixamento em bloco para a Série B (Sem fragmentação)");
// Vamos fazer os 4 jogos da Série A terminarem:
// Encontraremos a partida em que o Lucas está jogando
let lucasMatchA = matchesA.find(m => m.player1.name === "Lucas Silveira" || m.player2.name === "Lucas Silveira");
assert.ok(lucasMatchA, "Lucas deve estar em uma das partidas da Série A");

matchesA.forEach(m => {
  // Configura ambos prontos
  engine.setPlayerReady(m.player1.id, m.id);
  engine.setPlayerReady(m.player2.id, m.id);
  engine.startMatchQuestion(m.id);

  // Se for o Lucas, faz ele perder; senão, Player 1 vence
  if (m.id === lucasMatchA.id) {
    const lucasIsP1 = m.player1.name === "Lucas Silveira";
    const lucasId = lucasIsP1 ? m.player1.id : m.player2.id;
    const opponentId = lucasIsP1 ? m.player2.id : m.player1.id;

    engine.submitAnswer(opponentId, m.id, m.question.answer);
    engine.submitAnswer(lucasId, m.id, "000"); // Lucas erra
  } else {
    engine.submitAnswer(m.player1.id, m.id, m.question.answer);
    engine.submitAnswer(m.player2.id, m.id, "000");
  }
});

// Verifica se os 4 perdedores da Série A (incluindo o Lucas) estão agora na Série B
assert.strictEqual(engine.series.B.matches.length, 2, "Série B deve ter exatamente 2 confrontos com os 4 rebaixados");
const lucasPlayer = Array.from(engine.players.values()).find(p => p.name === "Lucas Silveira");
assert.strictEqual(lucasPlayer.currentSeries, "B", "Lucas deve estar na Série B");

// Verifica que os 4 vencedores da Série A avançaram para as Semifinais da Série A (Rodada 2)
assert.strictEqual(engine.series.A.matches.length, 6, "Série A agora deve ter 4 + 2 = 6 partidas");
console.log("✅ Vencedores da Série A avançaram para a semifinal; 4 perdedores desceram juntos para a Série B!");

// -------------------------------------------------------------
// TESTE 4: Duelos da Série B -> Vencedores disputam Final e Lucas vai para Série C!
// -------------------------------------------------------------
console.log("\nTESTE 4: Vencedores da Série B disputam Final e Lucas cai para a Série C");
const matchesB = engine.series.B.matches;
assert.strictEqual(matchesB.length, 2, "Série B tem 2 semifinais");

let lucasMatchB = matchesB.find(m => m.player1.name === "Lucas Silveira" || m.player2.name === "Lucas Silveira");
assert.ok(lucasMatchB, "Lucas deve estar em uma partida da Série B");

// Executa as duas partidas da Série B
matchesB.forEach(m => {
  engine.setPlayerReady(m.player1.id, m.id);
  engine.setPlayerReady(m.player2.id, m.id);
  engine.startMatchQuestion(m.id);

  if (m.id === lucasMatchB.id) {
    const lucasIsP1 = m.player1.name === "Lucas Silveira";
    const lucasId = lucasIsP1 ? m.player1.id : m.player2.id;
    const opponentId = lucasIsP1 ? m.player2.id : m.player1.id;

    // Lucas perde novamente na Série B!
    engine.submitAnswer(opponentId, m.id, m.question.answer);
    engine.submitAnswer(lucasId, m.id, "000");
  } else {
    engine.submitAnswer(m.player1.id, m.id, m.question.answer);
    engine.submitAnswer(m.player2.id, m.id, "000");
  }
});

// 1. Os dois VENCEDORES da Série B agora DEVEM disputar a Final da Série B entre si!
assert.strictEqual(engine.series.B.matches.length, 3, "Série B agora deve ter a Final (2 semifinais + 1 final = 3 jogos)");
const finalB = engine.series.B.matches[2];
assert.strictEqual(finalB.round, 2, "A Final da Série B é a rodada 2");
console.log(`✅ Final da Série B criada com sucesso entre: ${finalB.player1.name} VS ${finalB.player2.name}!`);

// 2. O Lucas e o outro perdedor da Série B foram para a Série C e enfrentam-se na Série C!
assert.strictEqual(lucasPlayer.currentSeries, "C", "Lucas DEVE estar na Série C agora!");
assert.strictEqual(engine.series.C.matches.length, 1, "Série C deve ter a partida entre os dois perdedores da Série B!");
const matchC = engine.series.C.matches[0];
const lucasInC = matchC.player1.name === "Lucas Silveira" || matchC.player2.name === "Lucas Silveira";
assert.ok(lucasInC, "Lucas Silveira DEVE estar jogando a partida da Série C!");
console.log(`✅ Lucas Silveira está na Série C disputando contra: ${matchC.player1.name === "Lucas Silveira" ? matchC.player2.name : matchC.player1.name}!`);

// -------------------------------------------------------------
// TESTE 5: Séries Dinâmicas com turmas maiores (14, 21 e 28 estudantes)
// -------------------------------------------------------------
console.log("\nTESTE 5: Geração dinâmica de Séries D, E conforme quantidade de alunos (~7 por série)");

// Torneio com 21 alunos -> deve criar Série A (7), Série B (7), Série C (7)
const largeEngine = new TournamentEngine({ title: "Grande Torneio 21 Alunos" });
for (let i = 1; i <= 21; i++) {
  largeEngine.addPlayer(`Aluno ${i}`);
}
largeEngine.startTournament();

assert.ok(largeEngine.series.A, "Série A deve existir");
assert.ok(largeEngine.series.B, "Série B deve existir");
assert.ok(largeEngine.series.C, "Série C deve existir");
assert.ok(largeEngine.series.D, "Série D deve estar pronta para rebaixados");
assert.strictEqual(largeEngine.series.A.matches.length, 3, "Série A tem 3 jogos (7 alunos = 3 jogos + 1 bye)");
assert.strictEqual(largeEngine.series.B.matches.length, 3, "Série B tem 3 jogos");
assert.strictEqual(largeEngine.series.C.matches.length, 3, "Série C tem 3 jogos");
console.log("✅ 21 alunos distribuídos harmonicamente em Séries A, B e C (~7 por série)!");

// Torneio com 28 alunos -> deve gerar Série A, B, C, D e preparar Série E
const extraLargeEngine = new TournamentEngine({ title: "Copa Escolar 28 Alunos" });
for (let i = 1; i <= 28; i++) {
  extraLargeEngine.addPlayer(`Estudante ${i}`);
}
extraLargeEngine.startTournament();
assert.ok(extraLargeEngine.series.D, "Série D deve ter surgido dinamicamente");
assert.ok(extraLargeEngine.series.E, "Série E deve ter surgido para acolher perdedores da D");
console.log("✅ 28 alunos geraram Séries A, B, C, D e E dinamicamente!");

console.log("\n🎉 TODOS OS TESTES DA NOVA ENGINE DE CHAVEAMENTO PASSARAM COM 100% DE SUCESSO!\n");
