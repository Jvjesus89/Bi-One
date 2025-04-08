//consultar alunos
document.addEventListener("DOMContentLoaded", function () {
    const tabela = document.querySelector("#tabela-alunos tbody");
  
    db.collection("usuarios").get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const dados = doc.data();
        const tr = document.createElement("tr");
  
        tr.innerHTML = `
          <td>${dados.usuario || ""}</td>
          <td>${dados.NomeAluno || ""}</td>
          <td>${dados.Idade || ""}</td>
          <td>${dados.Telefone || ""}</td>
          <td>
            <button class="editar-btn" data-id="${doc.id}">✏️</button>
            <button class="excluir-btn" data-id="${doc.id}">🗑️</button>
          </td>
        `;
  
        tabela.appendChild(tr);
      });
  
      // Ativa o DataTable após os dados carregarem
      $('#tabela-alunos').DataTable();
  
      // Evento de exclusão
      document.querySelectorAll(".excluir-btn").forEach((botao) => {
        botao.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          if (confirm("Tem certeza que deseja excluir este aluno?")) {
            db.collection("usuarios").doc(id).delete().then(() => {
              alert("Aluno excluído com sucesso!");
              location.reload(); // Recarrega a página
            }).catch((error) => {
              console.error("Erro ao excluir:", error);
            });
          }
        });
      });
  
      // Evento de edição (agora funcional)
      document.querySelectorAll(".editar-btn").forEach((botao) => {
        botao.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          db.collection("usuarios").doc(id).get().then((doc) => {
            if (doc.exists) {
              abrirModalEdicao(doc.data(), doc.id);
            }
          });
        });
      });
  
    }).catch((error) => {
      console.error("Erro ao buscar alunos:", error);
    });
  });
  
  //cadastrar alunos
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-aluno");
    const modal = document.getElementById("myModal");
    const submitButton = document.getElementById("submit-button");
  
    form.addEventListener("submit", function (e) {
      e.preventDefault();
  
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.value = "Cadastrando...";
      }
  
      const usuario = document.querySelector('[name=usuario]').value.trim();
      const NomeAluno = document.querySelector('[name=NomeAluno]').value.trim();
      const Idade = document.querySelector('[name=Idade]').value;
      const Telefone = document.querySelector('[name=Telefone]').value;
      const senha = document.querySelector('[name=Senha]').value;
  
      if (typeof db === "undefined") {
        alert("Erro: DB não carregado!");
        resetBotao();
        return;
      }
  
      // 🔍 Verifica se o usuário já existe
      db.collection("usuarios")
        .where("usuario", "==", usuario)
        .get()
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            alert("Erro: Usuário já cadastrado com esse nome.");
            resetBotao();
            return;
          }
  
          // ✅ Usuário não existe, pode cadastrar
          return db.collection("usuarios").add({
            usuario,
            NomeAluno,
            Idade,
            Telefone,
            senha
          });
        })
        .then((docRef) => {
          if (docRef) {
            form.reset();
            if (modal) modal.style.display = "none";
  
            if (typeof carregarAlunos === "function") {
              carregarAlunos();
            } else {
              location.reload();
            }
          }
        })
        .catch((error) => {
          console.error("Erro ao cadastrar:", error);
          alert("Erro ao cadastrar aluno.");
        })
        .finally(() => {
          resetBotao();
        });
  
      function resetBotao() {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.value = "Cadastrar";
        }
      }
    });
  });
  
  
  
  
  //excluir alunos  
  document.querySelectorAll(".excluir-btn").forEach((botao) => {
    botao.addEventListener("click", () => {
      const id = botao.getAttribute("data-id");
      if (confirm("Deseja excluir este aluno?")) {
        db.collection("usuarios").doc(id).delete().then(() => {
          alert("Aluno excluído!");
          location.reload(); // recarregar a tabela
        });
      }
    });
  });

  //consultar login
  function verificarLogin() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
  
    if (!usuario || !senha) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
  
    db.collection("usuarios")
      .where("usuario", "==", usuario)
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          alert("Usuário não cadastrado.");
        } else {
          let senhaCorreta = false;
  
          querySnapshot.forEach((doc) => {
            const dados = doc.data();
            if (dados.Senha === senha) {
              senhaCorreta = true;
            }
          });
  
          if (senhaCorreta) {
            alert("Login realizado com sucesso!");
            localStorage.setItem("usuarioLogado", usuario);
            window.location.href = "principal.html"; // Altere para sua página
          } else {
            alert("Senha incorreta.");
          }
        }
      })
      .catch((error) => {
        console.error("Erro ao verificar login:", error);
        alert("Erro ao realizar login. Tente novamente.");
      });
  }
  
  
  