# 🏆 Torneio de Matemática | Arena de Duelos Gamificada em Tempo Real

Um sistema web completo, responsivo e em tempo real para competições e torneios de matemática escolares, gerenciado pelo professor e disputado pelos estudantes em computadores, tablets ou celulares.

Projetado pedagogicamente para engajar os alunos através de **duelos 1x1**, chaveamentos inteligentes de **~7 estudantes por chave**, mecânica de **Dica de Resolução na 2ª tentativa**, **Tecnologia Anti-Trapaça (detecção de troca de aba)** e um inovador **Sistema de Séries Dinâmicas (Série A, B, C, D, E...)** com rebaixamento onde nenhum aluno é eliminado.

---

## 🌟 Principais Funcionalidades

### 🎓 1. Painel do Professor (`/professor.html`)
- **Acesso Protegido por Senha**: Autenticação com a senha pedagógica `josenetomat`.
- **Entrada Opcional de Alunos & Lobby ao Vivo**:
  - O professor pode criar a sala deixando a lista de alunos vazia.
  - Projeta o código amigável (ex: `MAT-892`) no telão.
  - Os estudantes entram pelo celular ou computador e aparecem em tempo real no **Lobby da Sala**.
  - O professor dá a largada com 1 clique no botão **"Iniciar Torneio"**.
- **Chaveamento Inteligente (~7 Alunos por Chave)**:
  - Divisão automática e equilibrada em grupos de cerca de 7 a 8 alunos.
  - Surgimento dinâmico de novas séries (**Série D, E, F, G...**) conforme o volume de alunos inscritos.
- **Visão Panorâmica Unificada**:
  - Todas as séries (A, B, C, D...) exibidas lado a lado em colunas simultâneas (sem necessidade de alternar abas).
- **Tempo por Duelo Configurável & Cronômetro ao Vivo**:
  - Ajuste de tempo (45s, 60s, 90s, 120s, 180s ou Livre) com contagem regressiva em cada card de partida.
- **Banco de Perguntas em Bloco de Texto & Gerador de Prompt IA**:
  - Aceita perguntas coladas em formato de texto livre ou presets rápidos (Aritmética, Álgebra, Geometria).
  - Gerador de prompts para ChatGPT/Gemini/Claude com geração obrigatória de dicas pedagógicas para a 2ª tentativa.
- **Pódio com Galeria de Troféus & Relatório Individualizado**:
  - Campeões de todas as séries com seus respectivos troféus (Ouro, Prata, Bronze, etc.).
  - Gráficos no Chart.js: taxa de acerto na 1ª tentativa vs 2ª com dica, tempo de resposta e histórico detalhado por aluno.

### 🎮 2. Portal do Estudante (`/estudante.html`)
- **Login Instantâneo**: Inserção simples do código da sala e nome do aluno.
- **Visão Exclusiva e Focada**:
  - O aluno visualiza **apenas o seu oponente atual** e a meta motivacional de vitórias restantes para o troféu.
- **Botão "Pronto" + Countdown de 3 Segundos**:
  - A pergunta matemática fica oculta até que **ambos os alunos apertem o botão "ESTOU PRONTO! 🚀"**.
  - Em seguida, dispara uma contagem regressiva animada (**3... 2... 1... VALENDO! 💥**) e a pergunta é liberada no mesmo milissegundo para os dois.
- **🛡️ Tecnologia Anti-Trapaça (Detecção de Troca de Aba)**:
  - Monitoramento contínuo da tela via *Page Visibility API*.
  - Se o estudante sair da aba ou minimizar a janela para pesquisar ou usar IA durante o cálculo, o sistema decreta **Cartão Vermelho e Derrota Instantânea por Desclassificação**, concedendo a vitória ao adversário.
- **Comparação Justa & Dica de Ouro**:
  - Ambos respondem antes da IA comparar.
  - Se ambos acertarem: duelo empata e gera pergunta de desempate.
  - Se ambos errarem na 1ª tentativa: a **Dica de Ouro** é desbloqueada para a 2ª tentativa.
- **Tela de Campeão Personalizada por Série**:
  - Ao vencer o torneio, a tela final é personalizada com as cores e o troféu da série conquistada (**Troféu Ouro da Série A**, **Troféu Prata da Série B**, **Troféu Bronze da Série C**, etc.).

### 🎬 3. Tutorial Animado Interativo (`/tutorial.html`)
- Apresentação em 5 passos ilustrados com modo automático e sons, ideal para projetar aos alunos antes do início do torneio.

---

## 🚀 Como Executar Localmente

### Pré-requisitos:
- Node.js instalado (v18 ou superior).
- Git instalado.

### Passo a Passo:

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/SEU_USUARIO/torneio-matematica.git
   cd torneio-matematica
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Execute os testes automatizados**:
   ```bash
   npm test
   ```

4. **Inicie o servidor**:
   ```bash
   npm start
   ```

5. **Acesse no navegador**:
   - **Hub Inicial:** `http://localhost:3000`
   - **Painel do Professor:** `http://localhost:3000/professor.html` *(Senha: `josenetomat`)*
   - **Portal do Estudante:** `http://localhost:3000/estudante.html`
   - **Tutorial Animado:** `http://localhost:3000/tutorial.html`

6. **Acesso por Celulares e Tablets no Wi-Fi da Escola**:
   - O terminal exibe o IP da sua rede local (ex: `http://192.168.1.15:3000`).
   - Todos os alunos conectados no mesmo Wi-Fi podem acessar por esse endereço!

---

## 📂 Estrutura do Projeto

```
Torneio de Matemática/
├── package.json
├── server.js                     # Servidor Express + Socket.io em tempo real
├── test/
│   ├── engine.test.js            # Suíte de testes unitários da engine
│   └── e2e.test.js               # Teste de integração E2E com WebSockets
├── lib/
│   ├── tournament-engine.js      # Motor das séries dinâmicas, chaveamento e anti-trapaça
│   ├── question-parser.js        # Parser de perguntas e gabaritos matemáticos
│   └── prompt-generator.js       # Gerador de prompts pedagógicos para IA
├── public/
│   ├── index.html                # Hub de entrada
│   ├── professor.html            # Dashboard panorâmico do professor
│   ├── estudante.html            # Tela focada do aluno com proteção anti-trapaça
│   ├── tutorial.html             # Apresentação animada das regras
│   ├── css/
│   │   └── style.css             # Estilos com TailwindCSS e temas das séries
│   └── js/
│       ├── socket-client.js      # Gerenciador de conexão e sons sintéticos
│       ├── professor.js          # Lógica do lobby e visão panorâmica
│       ├── estudante.js          # Lógica do duelo, countdown e anti-trapaça
│       └── tutorial.js           # Slider do tutorial
└── README.md
```

---

## 📄 Licença
Distribuído sob a licença MIT. Sinta-se livre para usar, adaptar e aplicar em sala de aula!
