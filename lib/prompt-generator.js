/**
 * Prompt Generator para o Professor
 * Gera prompts prontos para copiar e colar no ChatGPT, Claude ou Gemini.
 */

function generateQuestionBankPrompt(options = {}) {
  const {
    topic = "Matemática Geral (Aritmética, Álgebra Básica e Raciocínio Lógico)",
    gradeLevel = "Ensino Fundamental II / Ensino Médio",
    count = 15,
    difficulty = "Misto (Fácil, Médio, Difícil)"
  } = options;

  return `Você é um Assistente Pedagógico Especialista em Gamificação de Matemática.
Preciso que você crie um banco com ${count} perguntas para um Torneio de Matemática escolar em formato de duelos 1x1.

NÍVEL ESCOLAR: ${gradeLevel}
TEMA / CONTEÚDO: ${topic}
DIFICULDADE: ${difficulty}

IMPORTANTE - REQUISITOS DO FORMATO:
Para cada questão, forneça OBRIGATORIAMENTE os três campos abaixo, separados por '---' entre cada questão:

1. Pergunta: O enunciado claro, direto e desafiador. Se houver fórmulas, use notação simples ou LaTeX (ex: 2x + 5 = 15).
2. Resposta: Apenas o valor final exato (número inteiro, decimal com vírgula ou fração simplificada) para que o sistema valide automaticamente.
3. Dica: Uma dica pedagógica inteligente! CONDIÇÃO CRUCIAL: Esta dica só será exibida se os dois estudantes errarem a 1ª tentativa. Portanto, a dica deve explicar o método ou primeiro passo para destravar o raciocínio, SEM dar a resposta final pronta de bandeja.

EXEMPLO DE SAÍDA ESPERADA:
---
Pergunta: Em uma promoção, uma camiseta que custava R$ 60,00 está com 20% de desconto. Qual é o valor do desconto em reais?
Resposta: 12
Dica: Para calcular 20% de 60, lembre-se de que 10% de 60 é 6. Como 20% é o dobro de 10%, basta dobrar esse valor!
---
Pergunta: Resolva a equação: 4x - 8 = 24. Qual o valor de x?
Resposta: 8
Dica: Comece somando 8 em ambos os lados da igualdade para isolar o termo 4x. Em seguida, divida o resultado por 4.
---

Por favor, gere agora as ${count} questões no formato exato acima, prontas para copiar e colar no sistema:`;
}

function generateLiveRefereePrompt(question, studentAnswer, officialAnswer) {
  return `Você é o Juiz Árbitro de uma partida do Torneio de Matemática.
Analise a resposta enviada pelo aluno.

QUESTÃO: "${question}"
GABARITO OFICIAL: "${officialAnswer}"
RESPOSTA ENVIADA PELO ALUNO: "${studentAnswer}"

INSTRUÇÕES:
1. Avalie se a resposta está CORRETA ou INCORRETA (considere variações de escrita aceitáveis, como unidades omitidas ou casas decimais equivalentes).
2. Se estiver INCORRETA, gere uma dica sutil incentivando o aluno a tentar novamente no duelo sem entregar a resposta final.
3. Responda em JSON:
{
  "valido": true/false,
  "mensagem": "Breve feedback pedagógico para o aluno",
  "dica_extra": "Dica caso ambos tenham errado"
}`;
}

function generatePostTournamentFeedbackPrompt(tournamentSummary) {
  return `Você é um tutor pedagógico de matemática.
Analise o relatório deste torneio de matemática e gere um feedback motivador e recomendações personalizadas:

DADOS DO TORNEIO:
${JSON.stringify(tournamentSummary, null, 2)}

Por favor, escreva um feedback acolhedor:
1. Parabenize os campeões da Série A, Série B e Série C.
2. Destaque o esforço dos alunos que superaram a 1ª rodada usando a Dica de Segunda Tentativa.
3. Aponte os 3 principais pontos de melhoria observados nos erros mais frequentes.`;
}

module.exports = {
  generateQuestionBankPrompt,
  generateLiveRefereePrompt,
  generatePostTournamentFeedbackPrompt
};
