function loadHTML(id, file, callback) {
    fetch(file)
      .then(response => response.text())
      .then(data => {
        document.getElementById(id).innerHTML = data;
        if (callback) callback(); // chama a função depois do carregamento
      })
      .catch(error => console.error('Erro ao carregar:', file, error));
  }
  
  window.onload = function () {
    loadHTML("header-placeholder", "header.html", setActiveMenu);
    loadHTML("footer-placeholder", "footer.html");
    loadHTML("head-placeholder", "head.html");
  };
  
  function setActiveMenu() {
    const currentPage = window.location.pathname.split("/").pop();
    const menuLinks = document.querySelectorAll("ul.nav-tabs li a");
  
    menuLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (href === currentPage) {
        link.parentElement.classList.add("active");
      } else {
        link.parentElement.classList.remove("active");
      }
    });
  }
/* Abrir tela de cadastro */
  document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("myModal");
    const btnAbrir = document.getElementById("btnAbrirCadastro");
    const spanFechar = document.querySelector(".close");

    // Abrir modal ao clicar no botão
    btnAbrir.onclick = function () {
      modal.style.display = "block";
    };

    // Fechar modal ao clicar no "x"
    spanFechar.onclick = function () {
      modal.style.display = "none";
    };

    // Fechar modal ao clicar fora do conteúdo
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  });

  let modal = document.getElementById("myModal");
  let spanClose = document.querySelector(".close");
/*formartar numero de telefone*/
document.addEventListener("DOMContentLoaded", function () {
  const telefoneInput = document.querySelector('[name=Telefone]');

  if (telefoneInput) {
    telefoneInput.addEventListener("input", function (e) {
      let valor = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número

      if (valor.length > 11) valor = valor.slice(0, 11); // Limita a 11 dígitos

      if (valor.length > 0) {
        if (valor.length <= 10) {
          // Fixo ou celular antigo (sem nono dígito)
          valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
          // Celular com nono dígito
          valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
      }

      e.target.value = valor;
    });
  }
});
