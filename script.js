// Inicializa o banco de dados
const request = indexedDB.open("FuncionariosDB", 1);//versão 1 do banco de dados funcionáriosDB indexedDB
//bancos de dados funcionáriosDB,
request.onupgradeneeded = function (event) {//evento de atualizar versões (onupgradeneeded)
    let db = event.target.result; //retorna o banco de dados que está sendo criado ou atualizado
    let store = db.createObjectStore("funcionarios", { keyPath: "id", autoIncrement: true }); //cria um espaço aonde os dados são armazenados
//store.createIndex() cria um indice no objeto store
    store.createIndex("nome", "nome", { unique: false });
    store.createIndex("cpf", "cpf", { unique: true });
    store.createIndex("email", "email", { unique: true });
    store.createIndex("telefone",{unique:true});
    store.createIndex("cargo",{unique:false});
};

request.onsuccess = function (event) {//evento executado quando a operação foi concluida  com sucesso.
    console.log("Banco de dados carregado com sucesso!");
    listarFuncionarios(); // Garante que os dados sejam carregados ao iniciar
};

request.onerror = function (event) {//evento executado quando houve erro na operação.
    console.error("Erro ao abrir o IndexedDB:", event.target.error);
};

// Função auxiliar para verificar se o banco de dados foi carregado corretamente
function verificarDB() {
    if (!request.result) {//verifica se o banco esta disponívelcaso não esteja retorna null
        console.error("O banco de dados não foi carregado corretamente.");
        return null;
    }
    return request.result;
}

// Captura o evento de envio do formulário
document.querySelector(".add_names").addEventListener("submit", function (event) {
    event.preventDefault();
    let funcionario = {//criando objeto funcionário, as palavras seguidas de dois pontos são atributos.
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

    let transaction = db.transaction("funcionarios", "readonly");//faz leitura do banco de funcionarios
    let store = transaction.objectStore("funcionarios");

    let listaFuncionarios = document.querySelector(".your_dates");//exibir lista de funcionario no html
    listaFuncionarios.innerHTML = ""; // Limpa antes de exibir
    
    let cursorRequest = store.openCursor();//jeito que o indexedDB usa para percorrer todos os registros dentro da Store
    cursorRequest.onsuccess = function (event) {//lista executada com sucesso
        let cursor = event.target.result;//cursor aponta para cada registro
        if (cursor) {//se o registro existir
            let funcionario = cursor.value;//o cursor busca as informações(valores) dos funcionarios
            listaFuncionarios.innerHTML += `<p>ID: ${funcionario.id} - Nome: ${funcionario.nome} - CPF: ${funcionario.cpf} -
            E-mail: ${funcionario.email} - Cargo: ${funcionario.cargo} - telefone: ${funcionario.telefone}- nascimento:${funcionario.data_nascimento}</p>`;
            
            cursor.continue();
        } else {
            mostrarFeedback("Lista de funcionários carregada com sucesso!", "success");
        }
    };

    cursorRequest.onerror = function (event) {//erro ao listar funcionarios
        console.error("Erro ao listar funcionários:", event.target.error);
        mostrarFeedback("Erro ao listar funcionários!", "error");
    };
}


// Função para adicionar um funcionário com feedback visual
function adicionarFuncionario(funcionario) {
    let db = verificarDB();//led db chama função verificar banco de dados
    if (!db) return;//se estiver vazio sai da função

    let transaction = db.transaction("funcionarios", "readwrite");//cria uma transação entre objeto e funcionario o readwrite permite gerir(crud: inserir,ler,atualizar,deletar) os dados
    let store = transaction.objectStore("funcionarios");//referencia direta aonde os dados serão armazenados
    
    let addRequest = store.add(funcionario);//adicionar funcionario na store(lista)
    addRequest.onsuccess = function () {//funcionario adicionado com sucesso
        console.log("Funcionário adicionado com sucesso!");
        mostrarFeedback("Funcionário cadastrado com sucesso!", "success"); // Mostra feedback visual
        listarFuncionarios();//executa a função listar funcionario
    };

    addRequest.onerror = function (event) {//funcionario não foi adicionado
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

    let getRequest = store.get(id);
    getRequest.onsuccess = function () {
        let funcionario = getRequest.result;
        if (funcionario) {
            Object.assign(funcionario, novosDados); // Atualiza os dados do funcionário
            let updateRequest = store.put(funcionario);
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

    getRequest.onerror = function (event) {
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
    let feedback = document.querySelector_("feedback-msg");
    feedback.textContent = mensagem;
    feedback.className = `feedback ${tipo}`; // Aplica classe de sucesso ou erro
    feedback.style.display = "block";

    setTimeout(() => {
        feedback.style.display = "none"; // Oculta após 3 segundos
    }, 3000);
}



// Chamada inicial para listar funcionários ao carregar a página
window.onload = listarFuncionarios;