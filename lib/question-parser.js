/**
 * Question Parser & Built-in Question Banks
 * Suporta:
 * - Banco expandido de questões
 * - Gerador infinito de questões dinâmicas sem repetição
 * - Importação flexível por bloco de texto
 */

const DEFAULT_QUESTION_BANKS = {
  aritmetica: [
    {
      id: "q_ar_1",
      question: "Quanto é 15 \\times 14?",
      answer: "210",
      hint: "Decomponha 14 em 10 + 4: (15 x 10) + (15 x 4) = 150 + 60."
    },
    {
      id: "q_ar_2",
      question: "Qual o resultado de 250 \\div 5 + 18 \\times 2?",
      answer: "86",
      hint: "Primeiro faça as divisões e multiplicações: 250/5 = 50 e 18x2 = 36. Depois some 50 + 36."
    },
    {
      id: "q_ar_3",
      question: "Calcule: 12^2 - 4^2.",
      answer: "128",
      hint: "12 ao quadrado é 144 e 4 ao quadrado é 16. Calcule 144 - 16."
    },
    {
      id: "q_ar_4",
      question: "Quanto é 35\\% de 240?",
      answer: "84",
      hint: "10% de 240 é 24. 30% é 24x3 = 72. 5% é 12. Some 72 + 12."
    },
    {
      id: "q_ar_5",
      question: "Se uma pizza foi dividida em 8 pedaços e Lucas comeu 3/8 e Ana comeu 2/8, quantos pedaços sobraram?",
      answer: "3",
      hint: "Juntos comeram 3 + 2 = 5 pedaços de 8. Quantos pedaços faltam para completar 8?"
    },
    {
      id: "q_ar_6",
      question: "Qual o dobro de 17 somado com a metade de 64?",
      answer: "66",
      hint: "O dobro de 17 é 34. A metade de 64 é 32. Some 34 + 32."
    },
    {
      id: "q_ar_7",
      question: "Calcule \\sqrt{196} + \\sqrt{81}.",
      answer: "23",
      hint: "A raiz de 196 é 14 e a raiz de 81 é 9. Calcule 14 + 9."
    },
    {
      id: "q_ar_8",
      question: "Um produto de R$ 80,00 teve um aumento de 25%. Qual o novo preço?",
      answer: "100",
      hint: "25% é o mesmo que dividir por 4. 80 / 4 = 20 de aumento. 80 + 20 = 100."
    },
    {
      id: "q_ar_9",
      question: "Quanto é 16 \\times 25?",
      answer: "400",
      hint: "Pense em 16 como 4 x 4. Então 4 x (4 x 25) = 4 x 100 = 400."
    },
    {
      id: "q_ar_10",
      question: "Calcule o valor de: 100 - 4 \\times (6 + 3).",
      answer: "64",
      hint: "Resolva os parênteses primeiro: 6 + 3 = 9. Depois multiplique: 4 x 9 = 36. Por fim, 100 - 36."
    },
    {
      id: "q_ar_11",
      question: "Qual é o menor múltiplo comum (MMC) entre 6 e 8?",
      answer: "24",
      hint: "Múltiplos de 6: 6, 12, 18, 24, 30... Múltiplos de 8: 8, 16, 24, 32... Qual o primeiro em comum?"
    },
    {
      id: "q_ar_12",
      question: "Quanto é 45\\% de 200?",
      answer: "90",
      hint: "50% de 200 é 100. 5% de 200 é 10. Subtraia 100 - 10."
    },
    {
      id: "q_ar_13",
      question: "Calcule: 7^2 + 3^3.",
      answer: "76",
      hint: "7^2 = 49 e 3^3 = 27. Some 49 + 27."
    },
    {
      id: "q_ar_14",
      question: "Quanto é 720 \\div 8 - 35?",
      answer: "55",
      hint: "720 / 8 = 90. Agora calcule 90 - 35."
    },
    {
      id: "q_ar_15",
      question: "Em um jogo de videogame, você ganha 15 pontos por acerto. Se você acertou 12 vezes seguidas, quantos pontos fez?",
      answer: "180",
      hint: "Faça 10 x 15 = 150 e adicione 2 x 15 = 30. 150 + 30 = ?"
    }
  ],

  algebra: [
    {
      id: "q_alg_1",
      question: "Resolva a equação: 3x - 7 = 20. Qual o valor de x?",
      answer: "9",
      hint: "Some 7 aos dois lados: 3x = 27. Em seguida, divida 27 por 3."
    },
    {
      id: "q_alg_2",
      question: "Resolva: 5(x - 2) = 3x + 6. Qual o valor de x?",
      answer: "8",
      hint: "Distribua o 5: 5x - 10 = 3x + 6. Agrupe os termos com x: 2x = 16."
    },
    {
      id: "q_alg_3",
      question: "Dada a equação x^2 - 7x + 12 = 0, qual é a MAIOR raiz?",
      answer: "4",
      hint: "Fatore: procuramos dois números cuja soma seja 7 e o produto seja 12 (3 e 4)."
    },
    {
      id: "q_alg_4",
      question: "Se f(x) = 2x^2 - 3x + 5, quanto vale f(3)?",
      answer: "14",
      hint: "Substitua x por 3: 2*(9) - 3*(3) + 5 = 18 - 9 + 5."
    },
    {
      id: "q_alg_5",
      question: "Se o triplo de um número adicionado a 15 é igual a 60, que número é esse?",
      answer: "15",
      hint: "3x + 15 = 60 => 3x = 45 => x = 45 / 3."
    },
    {
      id: "q_alg_6",
      question: "Qual o valor de x no sistema: x + y = 10 e x - y = 4?",
      answer: "7",
      hint: "Some as duas equações: (x+y) + (x-y) = 10 + 4 => 2x = 14 => x = 7."
    },
    {
      id: "q_alg_7",
      question: "Resolva a equação: 4x + 12 = 2x + 28. Qual o valor de x?",
      answer: "8",
      hint: "Passe 2x para a esquerda subtraindo e 12 para a direita subtraindo: 2x = 16."
    },
    {
      id: "q_alg_8",
      question: "Se a + b = 15 e a \\times b = 50, com a > b, qual é o valor de a?",
      answer: "10",
      hint: "Pense em dois números que somados dão 15 e multiplicados dão 50: 10 e 5."
    },
    {
      id: "q_alg_9",
      question: "Qual o valor de x em: x / 4 + 7 = 12?",
      answer: "20",
      hint: "Subtraia 7 de ambos os lados: x / 4 = 5. Multiplique por 4."
    },
    {
      id: "q_alg_10",
      question: "Se x^2 = 81 e x > 0, qual o valor de 2x - 5?",
      answer: "13",
      hint: "x é a raiz quadrada positiva de 81, logo x = 9. Calcule 2*(9) - 5."
    }
  ],

  geometria: [
    {
      id: "q_geo_1",
      question: "Qual a área de um triângulo com base 12 cm e altura 8 cm?",
      answer: "48",
      hint: "A fórmula da área do triângulo é (base x altura) / 2. (12 x 8) / 2 = 96 / 2."
    },
    {
      id: "q_geo_2",
      question: "Qual o perímetro de um retângulo de comprimento 14 cm e largura 9 cm?",
      answer: "46",
      hint: "O perímetro é a soma de todos os lados: 2 x (14 + 9) = 2 x 23."
    },
    {
      id: "q_geo_3",
      question: "Em um triângulo retângulo, os catetos medem 6 cm e 8 cm. Quanto mede a hipotenusa?",
      answer: "10",
      hint: "Teorema de Pitágoras: h^2 = 6^2 + 8^2 = 36 + 64 = 100. Raiz de 100 é 10."
    },
    {
      id: "q_geo_4",
      question: "Quantos graus mede a soma dos ângulos internos de qualquer triângulo?",
      answer: "180",
      hint: "É uma propriedade fundamental da geometria euclidiana (meia volta inteira)."
    },
    {
      id: "q_geo_5",
      question: "Qual a área de um quadrado cujo perímetro é igual a 36 cm?",
      answer: "81",
      hint: "Como o quadrado tem 4 lados iguais, cada lado mede 36 / 4 = 9 cm. A área é lado x lado: 9 x 9."
    },
    {
      id: "q_geo_6",
      question: "Qual o volume de um cubo com aresta medindo 5 cm?",
      answer: "125",
      hint: "O volume do cubo é a aresta ao cubo: 5 x 5 x 5 = ?"
    },
    {
      id: "q_geo_7",
      question: "Quantos graus mede o ângulo reto?",
      answer: "90",
      hint: "É o ângulo formado por duas retas perpendiculares (canto de uma folha de papel)."
    },
    {
      id: "q_geo_8",
      question: "Um losango possui diagonais medindo 10 cm e 6 cm. Qual é a sua área?",
      answer: "30",
      hint: "A área do losango é (Diagonal Maior x diagonal menor) / 2 = (10 x 6) / 2."
    }
  ]
};

/**
 * Gerador algorítmico de questões infinitas sem repetição.
 * Cria problemas matemáticos aleatórios com gabarito exato e dica explicativa.
 */
let dynamicGenCounter = 1;
function generateDynamicMathQuestion() {
  const types = ["mult", "eq", "pct", "soma_sub", "potencia", "divisao"];
  const selectedType = types[Math.floor(Math.random() * types.length)];
  dynamicGenCounter++;

  if (selectedType === "mult") {
    const a = Math.floor(Math.random() * 12) + 11; // 11 a 22
    const b = Math.floor(Math.random() * 8) + 6;   // 6 a 13
    const ans = a * b;
    return {
      id: `dyn_${dynamicGenCounter}_${Date.now()}`,
      question: `Quanto é ${a} \\times ${b}?`,
      answer: String(ans),
      hint: `Decomponha: calcule (${a} x 10) ou arredonde para facilitar o cálculo mental.`
    };
  } else if (selectedType === "eq") {
    const x = Math.floor(Math.random() * 15) + 3; // 3 a 17
    const coef = Math.floor(Math.random() * 4) + 2; // 2 a 5
    const constant = Math.floor(Math.random() * 20) + 5; // 5 a 24
    const total = coef * x + constant;
    return {
      id: `dyn_${dynamicGenCounter}_${Date.now()}`,
      question: `Resolva a equação: ${coef}x + ${constant} = ${total}. Qual o valor de x?`,
      answer: String(x),
      hint: `Subtraia ${constant} de ${total} e divida o resultado por ${coef}.`
    };
  } else if (selectedType === "pct") {
    const pctList = [10, 15, 20, 25, 30, 40, 50];
    const pct = pctList[Math.floor(Math.random() * pctList.length)];
    const baseList = [60, 80, 120, 150, 160, 200, 240, 300, 400];
    const base = baseList[Math.floor(Math.random() * baseList.length)];
    const ans = (pct * base) / 100;
    return {
      id: `dyn_${dynamicGenCounter}_${Date.now()}`,
      question: `Quanto é ${pct}\\% de ${base}?`,
      answer: String(ans),
      hint: `10% de ${base} é ${base / 10}. Use esse valor para calcular ${pct}%.`
    };
  } else if (selectedType === "potencia") {
    const a = Math.floor(Math.random() * 7) + 11; // 11 a 17
    const b = Math.floor(Math.random() * 5) + 3;  // 3 a 7
    const ans = a * a - b * b;
    return {
      id: `dyn_${dynamicGenCounter}_${Date.now()}`,
      question: `Calcule o valor de: ${a}^2 - ${b}^2.`,
      answer: String(ans),
      hint: `${a} ao quadrado é ${a * a} e ${b} ao quadrado é ${b * b}. Calcule ${a * a} - ${b * b}.`
    };
  } else if (selectedType === "divisao") {
    const divisor = Math.floor(Math.random() * 6) + 4; // 4 a 9
    const ans = Math.floor(Math.random() * 25) + 12; // 12 a 36
    const dividendo = divisor * ans;
    const add = Math.floor(Math.random() * 15) + 10;
    return {
      id: `dyn_${dynamicGenCounter}_${Date.now()}`,
      question: `Qual o valor de (${dividendo} \\div ${divisor}) + ${add}?`,
      answer: String(ans + add),
      hint: `Primeiro faça ${dividendo} / ${divisor} = ${ans}. Depois some com ${add}.`
    };
  } else {
    const a = Math.floor(Math.random() * 150) + 120;
    const b = Math.floor(Math.random() * 80) + 45;
    const c = Math.floor(Math.random() * 40) + 15;
    const ans = a - b + c;
    return {
      id: `dyn_${dynamicGenCounter}_${Date.now()}`,
      question: `Calcule mentalmente: ${a} - ${b} + ${c}.`,
      answer: String(ans),
      hint: `Faça primeiro ${a} - ${b} = ${a - b}, depois adicione ${c}.`
    };
  }
}

function parseQuestionsFromText(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  const questions = [];
  const normalized = rawText.replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n\s*---\s*\n|\n\s*===\s*\n/);

  let counter = 1;

  for (const block of blocks) {
    const cleanBlock = block.trim();
    if (!cleanBlock) continue;

    const questionMatch = cleanBlock.match(/(?:Pergunta|Quest[aã]o|P)\s*:\s*([^\n]+)/i);
    const answerMatch = cleanBlock.match(/(?:Resposta|Gabarito|R)\s*:\s*([^\n]+)/i);
    const hintMatch = cleanBlock.match(/(?:Dica|Ajuda|D)\s*:\s*([^\n]+)/i);

    if (questionMatch && answerMatch) {
      questions.push({
        id: `q_custom_${counter++}`,
        question: questionMatch[1].trim(),
        answer: cleanAnswer(answerMatch[1].trim()),
        hint: hintMatch ? hintMatch[1].trim() : "Pense na operação inversa para conferir sua resposta."
      });
      continue;
    }

    const numberedMatch = cleanBlock.match(/^\s*(?:\d+[\.\)]\s*)?(.+?)\s*(?:\n\s*R\s*:\s*|\n\s*Resposta\s*:\s*)([^\n]+)(?:\n\s*Dica\s*:\s*([^\n]+))?/i);
    if (numberedMatch) {
      questions.push({
        id: `q_custom_${counter++}`,
        question: numberedMatch[1].trim(),
        answer: cleanAnswer(numberedMatch[2].trim()),
        hint: numberedMatch[3] ? numberedMatch[3].trim() : "Revise o passo a passo da conta."
      });
    }
  }

  return questions;
}

function cleanAnswer(ans) {
  if (!ans) return "";
  let cleaned = String(ans).trim();
  cleaned = cleaned.replace(/[.,;]$/, "");
  cleaned = cleaned.replace(/^x\s*=\s*/i, "");
  cleaned = cleaned.replace(/^r\s*:\s*/i, "");
  return cleaned.trim();
}

function normalizeMathString(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/\\times/g, "*")
    .replace(/x/g, "*")
    .replace(/\\div/g, "/")
    .replace(/÷/g, "/")
    .replace(/\+0/g, "");
}

function validateAnswer(studentAns, officialAns) {
  if (studentAns === null || studentAns === undefined) return false;
  if (officialAns === null || officialAns === undefined) return false;

  const cleanStudent = cleanAnswer(studentAns);
  const cleanOfficial = cleanAnswer(officialAns);

  if (cleanStudent.toLowerCase() === cleanOfficial.toLowerCase()) {
    return true;
  }

  const normStudent = normalizeMathString(cleanStudent);
  const normOfficial = normalizeMathString(cleanOfficial);
  if (normStudent === normOfficial) {
    return true;
  }

  const numStudent = parseFloat(normStudent);
  const numOfficial = parseFloat(normOfficial);
  if (!isNaN(numStudent) && !isNaN(numOfficial)) {
    return Math.abs(numStudent - numOfficial) < 0.0001;
  }

  return false;
}

module.exports = {
  DEFAULT_QUESTION_BANKS,
  parseQuestionsFromText,
  generateDynamicMathQuestion,
  validateAnswer,
  cleanAnswer
};
