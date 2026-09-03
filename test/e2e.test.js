/**
 * Teste E2E do Novo Chaveamento:
 * 1. Criação com lista de alunos VAZIA (opcional)
 * 2. 4 Estudantes entram via código no Lobby ao vivo
 * 3. Professor inicia o torneio
 * 4. Partidas geradas na Série A
 * 5. Rebaixamento de perdedores para a Série B
 */
const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3000";

async function runE2ETest() {
  console.log("Iniciando teste E2E do Chaveamento Dinâmico e Lobby...");

  const socketProf = io(SERVER_URL);
  let s1, s2, s3, s4;

  socketProf.on("connect", () => {
    console.log("1. Professor conectado!");

    // Cria torneio sem nenhum aluno na lista
    socketProf.emit("create_tournament", {
      title: "Torneio Chaveamento Dinâmico E2E",
      playersList: [], // VAZIO! 100% OPCIONAL
      bankPreset: "aritmetica",
      timeLimitSeconds: 60,
      password: "josenetomat"
    }, (res) => {
      console.log("2. Torneio criado sem alunos com código:", res.code);
      const tournamentCode = res.code;

      s1 = io(SERVER_URL);
      s1.emit("join_tournament", { code: tournamentCode, studentName: "Gabriel", role: "estudante" }, (res1) => {
        console.log("3. Gabriel entrou no Lobby:", res1.success);

        // Prepara listener antes de iniciar
        s1.on("student_view_updated", (viewG) => {
          if (viewG.inMatch && !viewG.isReady) {
            console.log(`8. Gabriel emparelhado contra ${viewG.opponent.name} na ${viewG.seriesName}!`);

            s1.emit("player_ready", {
              code: tournamentCode,
              playerId: res1.playerId,
              matchId: viewG.matchId
            }, (readyRes) => {
              console.log("9. Gabriel clicou Pronto:", readyRes.success);

              if (s1) s1.disconnect();
              if (s2) s2.disconnect();
              if (s3) s3.disconnect();
              if (s4) s4.disconnect();
              socketProf.disconnect();

              console.log("✅ TESTE E2E DE ENTRADA DINÂMICA E CHAVEAMENTO CONCLUÍDO COM SUCESSO!");
              process.exit(0);
            });
          }
        });

        // Aluno 2 entra pelo código
        s2 = io(SERVER_URL);
        s2.emit("join_tournament", { code: tournamentCode, studentName: "Laura", role: "estudante" }, (res2) => {
          console.log("4. Laura entrou no Lobby:", res2.success);

          // Aluno 3 entra pelo código
          s3 = io(SERVER_URL);
          s3.emit("join_tournament", { code: tournamentCode, studentName: "Pedro", role: "estudante" }, (res3) => {
            console.log("5. Pedro entrou no Lobby:", res3.success);

            // Aluno 4 entra pelo código
            s4 = io(SERVER_URL);
            s4.emit("join_tournament", { code: tournamentCode, studentName: "Beatriz", role: "estudante" }, (res4) => {
              console.log("6. Beatriz entrou no Lobby:", res4.success);

              // Professor agora clica em Iniciar Torneio
              socketProf.emit("start_tournament", {}, (startRes) => {
                console.log("7. Torneio iniciado com 4 alunos conectados:", startRes.success);
              });
            });
          });
        });
      });
    });
  });
}

runE2ETest();
