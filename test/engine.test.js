/**
 * Testes Automatizados da Engine do Torneio
 * Foco nas novas regras:
 * 1. Disputa por pontuação: 3+ acertos e à frente do oponente para vencer o duelo
 * 2. Sorteio de perguntas aleatórias e SEM REPETIÇÃO a cada rodada/empate
 * 3. Chaveamento de ~7 alunos por chave e Séries Dinâmicas A-E
 */

const assert = require("assert");
const TournamentEngine = require("../lib/tournament-engine");
const { DEFAULT_QUESTION_BANKS } = require("../lib/question-parser");

console.log("🚀 Iniciando testes das Novas Regras: 3+ Pontos para Vencer e Perguntas Sem Repetição...\n");

// -------------------------------------------------------------
// TESTE 1: Disputa por pontos (Corrida até 3+ acertos)
// -------------------------------------------------------------
console.log("TESTE 1: Disputa de Pontos (3+ acertos para vencer o duelo)");
const engine = new TournamentEngine({
  title: "Torneio Teste Pontuação",
  questions: DEFAULT_QUESTION_BANKS.aritmetica,
  timeLimitSeconds: 60
});

const p1 = engine.addPlayer("Alice");
const p2 = engine.addPlayer("Bruno");
engine.startTournament();

const match = engine.series.A.matches[0];
assert.strictEqual(match.targetScore, 3, "Alvo deve ser 3 pontos");
assert.strictEqual(match.score[p1.id], 0, "Alice começa com 0 pontos");
assert.strictEqual(match.score[p2.id], 0, "Bruno começa com 0 pontos");

// Ampla verificação de não repetição de questões
const seenQuestions = new Set();
seenQuestions.add(match.question.question);

engine.setPlayerReady(p1.id, match.id);
engine.setPlayerReady(p2.id, match.id);
engine.startMatchQuestion(match.id);

// Rodada 1: Ambos acertam -> Placar vira 1 x 1! Nova pergunta aleatória deve surgir!
console.log("-> Rodada 1: Ambos acertam");
engine.submitAnswer(p1.id, match.id, match.question.answer);
const res1 = engine.submitAnswer(p2.id, match.id, match.question.answer);

assert.strictEqual(res1.matchFinished, false, "Partida não deve acabar em 1x1");
assert.strictEqual(match.score[p1.id], 1, "Alice deve ter 1 ponto");
assert.strictEqual(match.score[p2.id], 1, "Bruno deve ter 1 ponto");
assert.ok(match.question.question, "Nova questão deve existir");
assert.ok(!seenQuestions.has(match.question.question), "A nova questão NÃO PODE SER IGUAL à anterior!");
seenQuestions.add(match.question.question);
console.log(`✅ Rodada 1: Placar 1x1! Nova pergunta inédita: "${match.question.question.substring(0, 30)}..."`);

// Rodada 2: Alice acerta, Bruno erra -> Placar vira 2 x 1! Nova pergunta!
console.log("-> Rodada 2: Alice acerta, Bruno erra");
engine.submitAnswer(p1.id, match.id, match.question.answer);
const res2 = engine.submitAnswer(p2.id, match.id, "000");

assert.strictEqual(res2.matchFinished, false, "Partida não deve acabar em 2x1");
assert.strictEqual(match.score[p1.id], 2, "Alice deve ter 2 pontos");
assert.strictEqual(match.score[p2.id], 1, "Bruno deve ter 1 ponto");
assert.ok(!seenQuestions.has(match.question.question), "A 3ª questão NÃO PODE SER IGUAL a nenhuma anterior!");
seenQuestions.add(match.question.question);
console.log(`✅ Rodada 2: Placar 2x1! Nova pergunta inédita: "${match.question.question.substring(0, 30)}..."`);

// Rodada 3: Ambos acertam -> Placar vira 3 x 2! Alice tem 3 pontos e está à frente -> Alice VENCE!
console.log("-> Rodada 3: Ambos acertam -> Alice atinge 3 pontos e vence (3 > 2)!");
engine.submitAnswer(p1.id, match.id, match.question.answer);
const res3 = engine.submitAnswer(p2.id, match.id, match.question.answer);

assert.strictEqual(res3.matchFinished, true, "Partida DEVE acabar quando Alice faz 3 pontos e lidera");
assert.strictEqual(res3.winnerId, p1.id, "Alice deve ser a vencedora");
assert.strictEqual(match.score[p1.id], 3);
assert.strictEqual(match.score[p2.id], 2);
assert.strictEqual(match.status, "FINISHED");
console.log("✅ Alice venceu a disputa por 3 x 2!");

// -------------------------------------------------------------
// TESTE 2: Disputa com empate em 3x3 e vitória por liderança (4x3)
// -------------------------------------------------------------
console.log("\nTESTE 2: Empate em 3x3 continua até alguém liderar (ex: 4x3)");
const engine2 = new TournamentEngine({ questions: DEFAULT_QUESTION_BANKS.aritmetica });
const c1 = engine2.addPlayer("Carlos");
const c2 = engine2.addPlayer("Diana");
engine2.startTournament();

const match2 = engine2.series.A.matches[0];
engine2.setPlayerReady(c1.id, match2.id);
engine2.setPlayerReady(c2.id, match2.id);
engine2.startMatchQuestion(match2.id);

// Simula acertos mútuos até 3x3
for (let r = 1; r <= 3; r++) {
  engine2.submitAnswer(c1.id, match2.id, match2.question.answer);
  const rRes = engine2.submitAnswer(c2.id, match2.id, match2.question.answer);
  assert.strictEqual(rRes.matchFinished, false, `Partida não deve acabar empatada em ${r}x${r}`);
}
assert.strictEqual(match2.score[c1.id], 3);
assert.strictEqual(match2.score[c2.id], 3);
console.log("✅ Em 3x3 o duelo continua em busca do desempate!");

// Próxima pergunta: Carlos erra, Diana acerta -> 4 x 3 para Diana -> Diana vence!
engine2.submitAnswer(c1.id, match2.id, "000");
const rFinal = engine2.submitAnswer(c2.id, match2.id, match2.question.answer);
assert.strictEqual(rFinal.matchFinished, true, "Diana deve vencer em 4x3!");
assert.strictEqual(rFinal.winnerId, c2.id);
console.log("✅ Diana venceu por 4 x 3 desempatando a partida!");

// -------------------------------------------------------------
// TESTE 3: Verificação de questões infinitas sem repetição
// -------------------------------------------------------------
console.log("\nTESTE 3: Garantia de perguntas sem repetição mesmo com muitas rodadas");
const dummyMatch = { usedQuestionIds: [], usedQuestionTexts: [] };
const setOfQuestions = new Set();

for (let i = 0; i < 25; i++) {
  const q = engine2.getRandomUnusedQuestion(dummyMatch);
  assert.ok(q.question, "Questão válida gerada");
  assert.ok(!setOfQuestions.has(q.question), `A questão não deve se repetir na 25ª iteração: ${q.question}`);
  setOfQuestions.add(q.question);
}
console.log("✅ 25 questões aleatórias geradas consecutivamente SEM NENHUMA REPETIÇÃO!");

console.log("\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!\n");
