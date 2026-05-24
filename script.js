// ==========================================
// ESTADO DO APP E DADOS
// ==========================================
let banco = [...window.BANCO_DE_QUESTOES];
let novasImagensGeradas = []; // { nome, base64 } para exportar depois

// Controle Estudo
let estudoLaminaIndex = 0;
let estudoQuestaoIndex = 0;

// Controle Prova
let provaLaminasAleatorias = [];
let provaLaminaAtualIndex = 0;
let provaQuestaoAtualIndex = 0;

// ==========================================
// ELEMENTOS DOM
// ==========================================
// Navegação de Abas
const navLinks = document.querySelectorAll('.nav-links li');
const tabContents = document.querySelectorAll('.tab-content');

// Aba Estudo
const laminaList = document.getElementById('lamina-list');
const laminaTitle = document.getElementById('lamina-title');
const laminaImage = document.getElementById('lamina-image');
const placeholderEstudo = document.getElementById('no-image-placeholder');
const questionCounter = document.getElementById('question-counter');
const questionText = document.getElementById('question-text');
const answerBox = document.getElementById('answer-box');
const answerText = document.getElementById('answer-text');
const btnShowAnswer = document.getElementById('btn-show-answer');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// Aba Prova
const provaImage = document.getElementById('prova-image');
const provaPlaceholder = document.getElementById('prova-no-image-placeholder');
const provaLaminaCounter = document.getElementById('prova-lamina-counter');
const provaQuestionCounter = document.getElementById('prova-question-counter');
const provaQuestionText = document.getElementById('prova-question-text');
const provaAnswerBox = document.getElementById('prova-answer-box');
const provaAnswerText = document.getElementById('prova-answer-text');
const btnProvaShowAnswer = document.getElementById('btn-prova-show-answer');
const btnProvaNext = document.getElementById('btn-prova-next');
const btnRevealLamina = document.getElementById('btn-reveal-lamina');
const provaLaminaRevealed = document.getElementById('prova-lamina-revealed');

// Aba Configuração
const configLaminaSelect = document.getElementById('config-lamina-select');
const imageUpload = document.getElementById('image-upload');
const cropperImage = document.getElementById('cropper-image');
const btnCrop = document.getElementById('btn-crop');
const croppedPreviewContainer = document.getElementById('cropped-preview-container');
const croppedPreview = document.getElementById('cropped-preview');
const newImageNameElement = document.getElementById('new-image-name');
const newLaminaTitle = document.getElementById('new-lamina-title');
const newQuestionsContainer = document.getElementById('new-questions-container');
const btnAddQ = document.getElementById('btn-add-q');
const btnSaveToBanco = document.getElementById('btn-save-to-banco');
const btnExportZip = document.getElementById('btn-export-zip');

let cropper;
let currentCroppedBase64 = null;
let currentGeneratedFilename = '';

// ==========================================
// INICIALIZAÇÃO E ABAS
// ==========================================
function initApp() {
    setupTabs();
    initEstudo();
    populateConfigSelect();
}

function setupTabs() {
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active de todos
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Adiciona ativo ao atual
            link.classList.add('active');
            const target = document.getElementById(link.dataset.tab);
            target.classList.add('active');

            if (link.dataset.tab === 'tab-prova') initProva();
            if (link.dataset.tab === 'tab-config') populateConfigSelect();
        });
    });
}

function triggerFade(element) {
    element.classList.remove('animate-fade');
    void element.offsetWidth; // force reflow
    element.classList.add('animate-fade');
}

// ==========================================
// MODO ESTUDO GUIADO
// ==========================================
function initEstudo() {
    renderSidebar();
    loadEstudoLamina(0);
}

function renderSidebar() {
    laminaList.innerHTML = '';
    banco.forEach((lamina, index) => {
        const li = document.createElement('li');
        li.textContent = lamina.titulo;
        if (index === estudoLaminaIndex) li.classList.add('active');
        li.addEventListener('click', () => loadEstudoLamina(index));
        laminaList.appendChild(li);
    });
}

function loadEstudoLamina(index) {
    if (banco.length === 0) return;
    estudoLaminaIndex = index;
    estudoQuestaoIndex = 0;
    
    Array.from(laminaList.children).forEach((li, i) => {
        if (i === index) li.classList.add('active');
        else li.classList.remove('active');
    });

    const lamina = banco[index];
    laminaTitle.textContent = lamina.titulo;
    
    laminaImage.src = lamina.imagemBase64 || lamina.imagem;
    laminaImage.style.display = 'block';
    placeholderEstudo.style.display = 'none';

    laminaImage.onerror = () => {
        laminaImage.style.display = 'none';
        placeholderEstudo.style.display = 'block';
        placeholderEstudo.innerHTML = `<p>Imagem <b>${lamina.imagem}</b> não encontrada.</p>`;
    };

    loadEstudoQuestao();
}

function loadEstudoQuestao() {
    const lamina = banco[estudoLaminaIndex];
    if (!lamina || lamina.perguntas.length === 0) return;
    
    const questao = lamina.perguntas[estudoQuestaoIndex];
    questionCounter.textContent = `Pergunta ${estudoQuestaoIndex + 1}/${lamina.perguntas.length}`;
    questionText.textContent = questao.pergunta;
    answerText.textContent = questao.resposta;
    
    triggerFade(questionText);
    triggerFade(laminaImage);
    
    answerBox.classList.add('hidden');
    answerBox.style.display = 'none';
    btnShowAnswer.textContent = 'Ver Resposta';
    
    btnPrev.disabled = estudoQuestaoIndex === 0;
    btnNext.disabled = estudoQuestaoIndex === lamina.perguntas.length - 1;
    btnShowAnswer.disabled = false;
}

btnShowAnswer.addEventListener('click', () => {
    if (answerBox.classList.contains('hidden')) {
        answerBox.style.display = 'block';
        setTimeout(() => answerBox.classList.remove('hidden'), 10);
        btnShowAnswer.textContent = 'Ocultar Resposta';
    } else {
        answerBox.classList.add('hidden');
        setTimeout(() => answerBox.style.display = 'none', 400);
        btnShowAnswer.textContent = 'Ver Resposta';
    }
});

btnPrev.addEventListener('click', () => { if (estudoQuestaoIndex > 0) { estudoQuestaoIndex--; loadEstudoQuestao(); } });
btnNext.addEventListener('click', () => { if (estudoQuestaoIndex < banco[estudoLaminaIndex].perguntas.length - 1) { estudoQuestaoIndex++; loadEstudoQuestao(); } });

// ==========================================
// MODO PROVA (ALEATÓRIO)
// ==========================================
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function initProva() {
    if (banco.length === 0) return;
    // Cria uma cópia e embaralha APENAS as lâminas
    provaLaminasAleatorias = banco.map(lamina => ({
        ...lamina,
        perguntas: [...lamina.perguntas] // <-- Mantém a ordem original das perguntas
    }));
    provaLaminasAleatorias = shuffle(provaLaminasAleatorias);
    
    provaLaminaAtualIndex = 0;
    provaQuestaoAtualIndex = 0;
    
    loadProvaQuestao();
}

function loadProvaQuestao() {
    if (provaLaminaAtualIndex >= provaLaminasAleatorias.length) {
        provaQuestionText.textContent = "Você completou todas as lâminas da prova!";
        provaImage.style.display = 'none';
        btnProvaShowAnswer.disabled = true;
        btnProvaNext.disabled = true;
        btnRevealLamina.disabled = true;
        return;
    }

    const lamina = provaLaminasAleatorias[provaLaminaAtualIndex];
    const questao = lamina.perguntas[provaQuestaoAtualIndex];

    provaLaminaCounter.textContent = `Lâmina ${provaLaminaAtualIndex + 1}/${provaLaminasAleatorias.length}`;
    provaQuestionCounter.textContent = `Pergunta ${provaQuestaoAtualIndex + 1}/${lamina.perguntas.length}`;
    
    // Imagem
    provaImage.src = lamina.imagemBase64 || lamina.imagem;
    provaImage.style.display = 'block';
    provaPlaceholder.style.display = 'none';
    
    provaImage.onerror = () => {
        provaImage.style.display = 'none';
        provaPlaceholder.style.display = 'block';
    };

    provaQuestionText.textContent = questao.pergunta;
    provaAnswerText.textContent = questao.resposta;
    
    triggerFade(provaQuestionText);
    triggerFade(provaImage);
    
    provaAnswerBox.classList.add('hidden');
    provaAnswerBox.style.display = 'none';
    btnProvaShowAnswer.textContent = 'Ver Resposta';
    
    provaLaminaRevealed.classList.add('hidden');
    provaLaminaRevealed.textContent = lamina.titulo;
    btnProvaShowAnswer.disabled = false;
}

btnProvaShowAnswer.addEventListener('click', () => {
    if (provaAnswerBox.classList.contains('hidden')) {
        provaAnswerBox.style.display = 'block';
        setTimeout(() => provaAnswerBox.classList.remove('hidden'), 10);
        btnProvaShowAnswer.textContent = 'Ocultar Resposta';
    } else {
        provaAnswerBox.classList.add('hidden');
        setTimeout(() => provaAnswerBox.style.display = 'none', 400);
        btnProvaShowAnswer.textContent = 'Ver Resposta';
    }
});

btnRevealLamina.addEventListener('click', () => {
    provaLaminaRevealed.classList.remove('hidden');
});

btnProvaNext.addEventListener('click', () => {
    const lamina = provaLaminasAleatorias[provaLaminaAtualIndex];
    if (provaQuestaoAtualIndex < lamina.perguntas.length - 1) {
        provaQuestaoAtualIndex++;
    } else {
        provaLaminaAtualIndex++;
        provaQuestaoAtualIndex = 0;
    }
    loadProvaQuestao();
});

// ==========================================
// CONFIGURADOR (CROP CIRCULAR E EXPORT NODE)
// ==========================================

function populateConfigSelect() {
    configLaminaSelect.innerHTML = '<option value="nova">✨ Criar Nova Lâmina</option>';
    banco.forEach((lamina, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = lamina.titulo;
        configLaminaSelect.appendChild(opt);
    });
}

function resetConfigForm() {
    newLaminaTitle.value = '';
    imageUpload.value = '';
    if (cropper) { cropper.destroy(); cropper = null; cropperImage.src = ''; }
    croppedPreviewContainer.classList.add('hidden');
    btnCrop.style.display = 'none';
    currentCroppedBase64 = null;
    currentGeneratedFilename = '';
    newQuestionsContainer.innerHTML = '<h4>Perguntas:</h4><div class="q-group"><input type="text" placeholder="Pergunta" class="text-input q-input"><textarea placeholder="Resposta" class="text-input r-input"></textarea></div>';
}

configLaminaSelect.addEventListener('change', () => {
    const val = configLaminaSelect.value;
    resetConfigForm();
    
    if (val !== 'nova') {
        const lamina = banco[parseInt(val)];
        newLaminaTitle.value = lamina.titulo;
        currentGeneratedFilename = lamina.imagem;
        
        // Populate questions
        newQuestionsContainer.innerHTML = '<h4>Perguntas:</h4>';
        lamina.perguntas.forEach(q => {
            const div = document.createElement('div');
            div.className = 'q-group';
            div.innerHTML = `
                <input type="text" placeholder="Pergunta" class="text-input q-input" value="${q.pergunta}">
                <textarea placeholder="Resposta" class="text-input r-input">${q.resposta}</textarea>
                <button class="btn accent-btn btn-remove-q" style="margin-top:5px; padding: 5px;">Remover</button>
            `;
            div.querySelector('.btn-remove-q').addEventListener('click', () => div.remove());
            newQuestionsContainer.appendChild(div);
        });
    }
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            cropperImage.src = event.target.result;
            if (cropper) cropper.destroy();
            cropper = new Cropper(cropperImage, {
                aspectRatio: 1, // forçar quadrado para o círculo perfeito
                viewMode: 1,
                autoCropArea: 1,
            });
            btnCrop.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

function getRoundedCanvas(sourceCanvas) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    canvas.width = width;
    canvas.height = height;

    context.imageSmoothingEnabled = true;
    context.drawImage(sourceCanvas, 0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    context.beginPath();
    context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true);
    context.fill();
    return canvas;
}

btnCrop.addEventListener('click', () => {
    if (!cropper) return;
    const croppedCanvas = cropper.getCroppedCanvas();
    const roundedCanvas = getRoundedCanvas(croppedCanvas); // aplica a mascara circular
    currentCroppedBase64 = roundedCanvas.toDataURL('image/png');
    
    croppedPreview.src = currentCroppedBase64;
    croppedPreviewContainer.classList.remove('hidden');
    
    if (configLaminaSelect.value === 'nova') {
        currentGeneratedFilename = `imagem${banco.length + 1}.png`;
    }
    // se for existente, mantem o currentGeneratedFilename
    newImageNameElement.textContent = currentGeneratedFilename;
});

btnAddQ.addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'q-group';
    div.innerHTML = `
        <input type="text" placeholder="Pergunta" class="text-input q-input">
        <textarea placeholder="Resposta" class="text-input r-input"></textarea>
        <button class="btn accent-btn btn-remove-q" style="margin-top:5px; padding: 5px;">Remover</button>
    `;
    div.querySelector('.btn-remove-q').addEventListener('click', () => div.remove());
    newQuestionsContainer.appendChild(div);
});

btnSaveToBanco.addEventListener('click', async () => {
    const titulo = newLaminaTitle.value.trim();
    const isNova = configLaminaSelect.value === 'nova';
    
    if (!titulo) return alert('Digite o nome da lâmina!');
    if (isNova && !currentCroppedBase64) return alert('Faça o recorte da imagem primeiro!');

    const qInputs = document.querySelectorAll('.q-input');
    const rInputs = document.querySelectorAll('.r-input');
    let perguntas = [];
    
    for (let i = 0; i < qInputs.length; i++) {
        const p = qInputs[i].value.trim();
        const r = rInputs[i].value.trim();
        if (p && r) perguntas.push({ pergunta: p, resposta: r });
    }

    if (perguntas.length === 0) return alert('Adicione pelo menos uma pergunta com resposta!');

    const id = isNova ? `lamina${banco.length + 1}` : banco[parseInt(configLaminaSelect.value)].id;
    const filename = isNova ? `imagem${banco.length + 1}.png` : currentGeneratedFilename;

    const laminaEditada = {
        id: id,
        titulo: titulo,
        imagem: filename,
        perguntas: perguntas
    };

    // Criar cópia limpa do banco para salvar no disco
    const bancoLimpo = banco.map(l => {
        const limpo = { ...l };
        delete limpo.imagemBase64; // caso exista de sessão
        return limpo;
    });

    if (isNova) {
        bancoLimpo.push(laminaEditada);
    } else {
        bancoLimpo[parseInt(configLaminaSelect.value)] = laminaEditada;
    }

    // Enviar para o servidor Node
    btnSaveToBanco.disabled = true;
    btnSaveToBanco.textContent = 'Salvando...';

    try {
        const response = await fetch('http://localhost:3000/api/save-lamina', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imagemFilename: filename,
                imagemBase64: currentCroppedBase64, // pode ser null se ele nao trocar a imagem da existente
                bancoCompleto: bancoLimpo
            })
        });

        const result = await response.json();
        
        if (result.success) {
            if (isNova) {
                // Para exibir em sessao (fallback caso o refresh falhe)
                if(currentCroppedBase64) laminaEditada.imagemBase64 = currentCroppedBase64;
                banco.push(laminaEditada);
            } else {
                if(currentCroppedBase64) laminaEditada.imagemBase64 = currentCroppedBase64;
                banco[parseInt(configLaminaSelect.value)] = laminaEditada;
            }
            
            alert(`Lâmina salva com sucesso direto na pasta!\nVerifique no Modo Estudo.`);
            
            resetConfigForm();
            populateConfigSelect();
            renderSidebar();
        } else {
            alert('Erro ao salvar no servidor: ' + result.error);
        }
    } catch (err) {
        alert('Erro de conexão! O servidor Node.js (server.js) está rodando?\nRode "node server.js" no terminal.');
        console.error(err);
    } finally {
        btnSaveToBanco.disabled = false;
        btnSaveToBanco.textContent = '💾 Salvar Lâmina Localmente';
    }
});

// Run
document.addEventListener('DOMContentLoaded', initApp);
