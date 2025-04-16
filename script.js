// Inicializa o banco de dados
const request = indexedDB.open("FuncionariosDB", 1); // Versão 1 do banco de dados funcionáriosDB do IndexedDB

request.onupgradeneeded = function (event) {
    // Evento de atualização
    let db = event.target.result;
    let store = db.createObjectStore("funcionarios", { keyPath: "id", autoIncrement: true });
    // store.createIndex() cria um índice no objeto store
    store.createIndex("nome", "nome", { unique: false });
    store.createIndex("cpf", "cpf", { unique: true });
    store.createIndex("email", "email", { unique: true });
    store.createIndex("telefone", "telefone", { unique: true });
    store.createIndex("cargo", "cargo", { unique: false });
};

request.onsuccess = function (event) {
    // Caso o evento seja executado com sucesso
    console.log("Banco de dados carregado com sucesso!");
    listarFuncionarios(); // Garante que os dados sejam carregados ao iniciar
};

request.onerror = function (event) {
    // Caso o evento não seja executado com sucesso
    console.error("Erro ao abrir o IndexedDB:", event.target.error);
};

// Função auxiliar para verificar se o banco de dados foi carregado corretamente
function verificarDB() {
    let db = request.result;
    if (!db) {
        console.error("O banco de dados não foi carregado corretamente.");
        return null;
    }
    return db;
}

// Captura o evento de envio do formulário
document.querySelector(".add_names").addEventListener("submit", function (event) {
    event.preventDefault();
    let funcionario = { // Criando o objeto funcionário, as palavras seguidas de dois pontos (:) são atributos
        nome: document.querySelector("#nome").value,
        cpf: document.querySelector("#cpf").value,
        email: document.querySelector("#email").value,
        telefone: document.querySelector("#telefone").value,
        data_nascimento: document.querySelector("#data_nascimento").value,
        cargo: document.querySelector("#cargo").value
    };

    adicionarFuncionario(funcionario);
});

// Função para listar funcionários com feedback visual
function listarFuncionarios() {
    let db = verificarDB();
    if (!db) {
        mostrarFeedback("Erro ao carregar banco de dados!", "error");
        return;
    }

    let transaction = db.transaction("funcionarios", "readonly"); // readonly só faz leitura do banco de dados funcionários
    let store = transaction.objectStore("funcionarios");

    let listaFuncionarios = document.querySelector(".your_dates"); // Exibir a lista de funcionários no HTML
    listaFuncionarios.innerHTML = ""; // Limpa antes de exibir

    let cursorRequest = store.openCursor(); // Jeito que o IndexedDB usa para percorrer todos os registros dentro da store
    cursorRequest.onsuccess = function (event) {
        let cursor = event.target.result; // O cursor aponta para cada registro
        if (cursor) {
            let funcionario = cursor.value; // O cursor busca as informações dos funcionários
            listaFuncionarios.innerHTML += `<p>ID: ${funcionario.id} - Nome: ${funcionario.nome} - CPF: ${funcionario.cpf}</p>`;
            cursor.continue();
        } else {
            mostrarFeedback("Lista de funcionários carregada com sucesso!", "success");
        }
    };

    cursorRequest.onerror = function (event) { // Erro ao listar funcionário
        console.error("Erro ao listar funcionários:", event.target.error);
        mostrarFeedback("Erro ao listar funcionários!", "error");
    };
}

// Função para adicionar um funcionário com feedback visual
function adicionarFuncionario(funcionario) {
    let db = verificarDB(); // Chama a função verificar banco de dados
    if (!db) return; // Se estiver vazio, sai da função

    let transaction = db.transaction("funcionarios", "readwrite"); // Criar uma transação com o objeto funcionário, o readwrite permite gerir (ler, inserir, atualizar e deletar) os dados
    let store = transaction.objectStore("funcionarios"); // Uma referência direta, onde os dados são armazenados

    let addRequest = store.add(funcionario); // Adicionando funcionário na store
    addRequest.onsuccess = function () { // Funcionário adicionado com sucesso
        console.log("Funcionário adicionado com sucesso!");
        mostrarFeedback("Funcionário cadastrado com sucesso!", "success"); // Mostra feedback visual
        listarFuncionarios();
    };

    addRequest.onerror = function (event) { // Erro ao adicionar funcionário
        console.error("Erro ao adicionar funcionário:", event.target.error);
        mostrarFeedback("Erro ao cadastrar funcionário!", "error"); // Exibe erro na interface
    };
}

// Função para atualizar um funcionário com feedback visual
function atualizarFuncionario(id, novosDados) {
    let db = verificarDB();
    if (!db) return;

    let transaction = db.transaction("funcionarios", "readwrite");
    let store = transaction.objectStore("funcionarios");

    let getRequest = store.get(id); // Pegar o número de registro do funcionário
    getRequest.onsuccess = function () { // Obteve sucesso ao achar o id de funcionário
        let funcionario = getRequest.result;
        if (funcionario) {
            Object.assign(funcionario, novosDados); // Atualiza os dados do funcionário
            let updateRequest = store.put(funcionario); // Alterar dados do funcionário
            updateRequest.onsuccess = function () {
                console.log("Funcionário atualizado com sucesso!");
                mostrarFeedback("Dados atualizados com sucesso!", "success"); // Mostra feedback visual
                listarFuncionarios();
            };

            updateRequest.onerror = function (event) {
                console.error("Erro ao atualizar funcionário:", event.target.error);
                mostrarFeedback("Erro ao atualizar funcionário!", "error"); // Exibe erro na interface
            };
        }
    };

    getRequest.onerror = function (event) { // Alteração não realizada
        console.error("Erro ao obter funcionário para atualização:", event.target.error);
        mostrarFeedback("Erro ao carregar funcionário para atualização!", "error"); // Feedback visual
    };
}

// Função para deletar um funcionário com feedback visual
function deletarFuncionario(id) {
    let db = verificarDB();
    if (!db) return;

    let transaction = db.transaction("funcionarios", "readwrite");
    let store = transaction.objectStore("funcionarios");

    let deleteRequest = store.delete(id);
    deleteRequest.onsuccess = function () {
        console.log("Funcionário deletado com sucesso!");
        mostrarFeedback("Funcionário removido com sucesso!", "success"); // Exibe feedback visual
        listarFuncionarios(); // Atualiza a lista após remoção
    };

    deleteRequest.onerror = function (event) {
        console.error("Erro ao deletar funcionário:", event.target.error);
        mostrarFeedback("Erro ao remover funcionário!", "error"); // Mostra mensagem de erro
    };
}

// Mostrar feedback
function mostrarFeedback(mensagem, tipo) {
    let feedback = document.getElementById("feedback-msg");
    feedback.textContent = mensagem;
    feedback.className = `feedback ${tipo}`; // Aplica classe de sucesso ou erro
    feedback.style.display = "block";

    setTimeout(() => { // Função de tempo
        feedback.style.display = "none"; // Oculta após 3 segundos
    }, 3000);
}

// Chamada inicial para listar funcionários ao carregar a página
window.onload = listarFuncionarios;
