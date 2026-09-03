/**
 * Question Parser & Built-in Question Banks
 * Suporta importação flexível por bloco de texto:
 *   Pergunta: ...
 *   Resposta: ...
 *   Dica: ...
 * ou formatos numerados:
 *   1. Qual o valor de x em 2x + 4 = 10?
 *   R: 3
 *   Dica: Isole 2x subtraindo 4 de ambos os lados.
 */

const DEFAULT_QUESTION_BANKS = {
  aritmetica: [
    {
      id: "q_ar_1",
      question: "Quanto é 15 \\times 14?",
      answer: "210",
      hint: "Decomponha 14 em 10 + 4: (15 x 10) + (15 x 4) = 150 + 60.",
      difficulty: "Fácil"
    },
    {
      id: "q_ar_2",
      question: "Qual o resultado de 250 \\div 5 + 18 \\times 2?",
      answer: "86",
      hint: "Primeiro faça as divisões e multiplicações: 250/5 = 50 e 18x2 = 36. Depois some.",
      difficulty: "Fácil"
    },
    {
      id: "q_ar_3",
      question: "Calcule: 12^2 - 4^2.",
      answer: "128",
      hint: "12 ao quadrado é 144 e 4 ao quadrado é 16. Calcule 144 - 16.",
      difficulty: "Médio"
    },
    {
      id: "q_ar_4",
      question: "Quanto é 35\\% de 240?",
      answer: "84",
      hint: "10% de 240 é 24. 30% é 24x3 = 72. 5% é 12. Some 72 + 12.",
      difficulty: "Médio"
    },
    {
      id: "q_ar_5",
      question: "Se uma pizza foi dividida em 8 pedaços e Lucas comeu 3/8 e Ana comeu 2/8, quantos pedaços sobraram?",
      answer: "3",
      hint: "Juntos comeram 3 + 2 = 5 pedaços de 8. Quantos faltam para 8?",
      difficulty: "Fácil"
    },
    {
      id: "q_ar_6",
      question: "Qual o dobro de 17 somado com a metade de 64?",
      answer: "66",
      hint: "O dobro de 17 é 34. A metade de 64 é 32. Some 34 + 32.",
      difficulty: "Médio"
    },
    {
      id: "q_ar_7",
      question: "Calcule \\sqrt{196} + \\sqrt{81}.",
      answer: "23",
      hint: "A raiz de 196 é 14 e a raiz de 81 é 9. 14 + 9 = ?",
      difficulty: "Médio"
    },
    {
      id: "q_ar_8",
      question: "Um produto de R$ 80,00 teve um aumento de 25%. Qual o novo preço?",
      answer: "100",
      hint: "25% é o mesmo que dividir por 4. 80 / 4 = 20 de aumento. 80 + 20 = ?",
      difficulty: "Fácil"
    }
  ],

  algebra: [
    {
      id: "q_alg_1",
      question: "Resolva a equação: 3x - 7 = 20. Qual o valor de x?",
      answer: "9",
      hint: "Some 7 aos dois lados: 3x = 27. Em seguida, divida 27 por 3.",
      difficulty: "Fácil"
    },
    {
      id: "q_alg_2",
      question: "Resolva: 5(x - 2) = 3x + 6. Qual o valor de x?",
      answer: "8",
      hint: "Distribua o 5: 5x - 10 = 3x + 6. Agrupe os termos com x: 2x = 16.",
      difficulty: "Médio"
    },
    {
      id: "q_alg_3",
      question: "Dada a equação x^2 - 7x + 12 = 0, qual é a MAIOR raiz?",
      answer: "4",
      hint: "Fatore: procuramos dois números cuja soma seja 7 e o produto seja 12 (3 e 4).",
      difficulty: "Médio"
    },
    {
      id: "q_alg_4",
      question: "Se f(x) = 2x^2 - 3x + 5, quanto vale f(3)?",
      answer: "14",
      hint: "Substitua x por 3: 2*(9) - 3*(3) + 5 = 18 - 9 + 5.",
      difficulty: "Médio"
    },
    {
      id: "q_alg_5",
      question: "Se o triplo de um número adicionado a 15 é igual a 60, que número é esse?",
      answer: "15",
      hint: "3x + 15 = 60 => 3x = 45 => x = 45 / 3.",
      difficulty: "Fácil"
    },
    {
      id: "q_alg_6",
      question: "Qual o valor de x no sistema: x + y = 10 e x - y = 4?",
      answer: "7",
      hint: "Some as duas equações: (x+y) + (x-y) = 10 + 4 => 2x = 14.",
      difficulty: "Médio"
    }
  ],

  geometria: [
    {
      id: "q_geo_1",
      question: "Qual a área de um triângulo com base 12 cm e altura 8 cm?",
      answer: "48",
      hint: "A fórmula da área do triângulo é (base x altura) / 2. (12 x 8) / 2 = ?",
      difficulty: "Fácil"
    },
    {
      id: "q_geo_2",
      question: "Qual o perímetro de um retângulo de comprimento 14 cm e largura 9 cm?",
      answer: "46",
      hint: "O perímetro é a soma de todos os lados: 2 x (14 + 9) = 2 x 23.",
      difficulty: "Fácil"
    },
    {
      id: "q_geo_3",
      question: "Em um triângulo retângulo, os catetos medem 6 cm e 8 cm. Quanto mede a hipotenusa?",
      answer: "10",
      hint: "Teorema de Pitágoras: a^2 = 6^2 + 8^2 = 36 + 64 = 100. Raiz de 100 é...",
      difficulty: "Médio"
    },
    {
      id: "q_geo_4",
      question: "Quantos graus mede a soma dos ângulos internos de qualquer triângulo?",
      answer: "180",
      hint: "É uma propriedade fundamental da geometria euclidiana (meia volta inteira).",
      difficulty: "Fácil"
    },
    {
      id: "q_geo_5",
      question: "Qual a área de um círculo com raio r = 7? (Considere \\pi \\approx 22/7)",
      answer: "154",
      hint: "Área = pi * r^2. (22/7) * 49 = 22 * 7 = 154.",
      difficulty: "Difícil"
    }
  ]
};

/**
 * Normaliza uma resposta para comparação justa:
 * - Converte vírgula decimal para ponto
 * - Remove espaços e pontuações finais
 * - Converte para minúsculas
 */
function normalizeAnswer(ans) {
  if (ans === undefined || ans === null) return "";
  let s = String(ans).trim().toLowerCase();
  // Remove trailing dots or commas
  s = s.replace(/[\.\,\;]$/, "").trim();
  // Normalize comma decimal to dot: e.g. "3,5" -> "3.5"
  s = s.replace(/(\d+),(\d+)/g, "$1.$2");
  // Remove superfluous spaces inside: e.g. "x = 4" -> "4" if numeric comparison
  if (/^[a-z]\s*=\s*(.+)$/i.test(s)) {
    s = s.replace(/^[a-z]\s*=\s*/i, "").trim();
  }
  return s;
}

/**
 * Valida a resposta do estudante comparando com a resposta oficial
 */
function validateAnswer(studentAnswer, officialAnswer) {
  const normStudent = normalizeAnswer(studentAnswer);
  const normOfficial = normalizeAnswer(officialAnswer);

  if (!normStudent) return false;

  // Comparação exata após normalização
  if (normStudent === normOfficial) return true;

  // Comparação numérica (caso haja variação de casas decimais: 14 vs 14.0)
  const numStudent = parseFloat(normStudent);
  const numOfficial = parseFloat(normOfficial);
  if (!isNaN(numStudent) && !isNaN(numOfficial)) {
    if (Math.abs(numStudent - numOfficial) < 0.0001) {
      return true;
    }
  }

  // Se oficial tiver múltiplas respostas aceitas separadas por barra ou vírgula
  if (officialAnswer.includes("/") || officialAnswer.includes(";")) {
    const parts = officialAnswer.split(/[\/;]/).map(p => normalizeAnswer(p));
    if (parts.includes(normStudent)) return true;
  }

  return false;
}

/**
 * Parseador de bloco de texto livre
 * Aceita:
 * Pergunta: ...
 * Resposta: ...
 * Dica: ...
 *
 * ou formato com números:
 * 1. Pergunta
 * R: 10
 * Dica: ...
 */
function parseQuestionsFromText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const questions = [];
  // Divide por separadores explícitos de questão (--- ou linhas em branco duplas)
  const blocks = rawText.split(/(?:\r?\n\s*---\s*\r?\n)|(?:\r?\n\s*\r?\n\s*\r?\n)/);

  let counter = 1;

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    let question = "";
    let answer = "";
    let hint = "";
    let difficulty = "Médio";

    // Procura por Pergunta / P: / Enunciado:
    const qMatch = block.match(/(?:(?:Pergunta|Quest[aã]o|P|Enunciado)\s*:\s*|^\d+[\.\)\-]\s*)([\s\S]*?)(?=(?:Resposta|R|Resp|Gabarito)\s*:|$)/i);
    // Procura por Resposta / R: / Gabarito:
    const aMatch = block.match(/(?:Resposta|R|Resp|Gabarito)\s*:\s*([\s\S]*?)(?=(?:Dica|Ajuda|Tip|D)\s*:|$)/i);
    // Procura por Dica / Ajuda / Tip:
    const hMatch = block.match(/(?:Dica|Ajuda|Tip|D)\s*:\s*([\s\S]*?)$/i);

    if (qMatch && qMatch[1]) {
      question = qMatch[1].trim();
      // Remove possível número inicial se sobrou
      question = question.replace(/^\d+[\.\)\-]\s*/, "").trim();
    }

    if (aMatch && aMatch[1]) {
      answer = aMatch[1].trim();
    }

    if (hMatch && hMatch[1]) {
      hint = hMatch[1].trim();
    }

    // Fallback: se não usou prefixos, mas tem 3 linhas no bloco
    if (!question || !answer) {
      const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        question = lines[0].replace(/^\d+[\.\)\-]\s*/, "");
        answer = lines[1].replace(/^(?:R|Resposta)\s*:\s*/i, "");
        if (lines.length >= 3) {
          hint = lines[2].replace(/^(?:D|Dica)\s*:\s*/i, "");
        }
      }
    }

    if (question && answer) {
      if (!hint) {
        hint = "Pense nos conceitos básicos e revise suas operações com atenção.";
      }
      questions.push({
        id: `custom_${Date.now()}_${counter++}`,
        question,
        answer,
        hint,
        difficulty
      });
    }
  }

  return questions;
}

module.exports = {
  DEFAULT_QUESTION_BANKS,
  parseQuestionsFromText,
  normalizeAnswer,
  validateAnswer
};
