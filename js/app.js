// Controlador principal de interfaz y flujo de pantallas

// Inicialización de la app
document.addEventListener("DOMContentLoaded", function () {
    cargarBorradorGuardado();
    
    // Si ya existe borrador con datos, llenar textarea intro
    if (appState.ideaInicial) {
        const inputIdea = document.getElementById("input-idea");
        if (inputIdea) inputIdea.value = appState.ideaInicial;
    }
    
    aplicarTraduccionesUI();
    lucide.createIcons();

    // Atajos de teclado prácticos
    document.addEventListener("keydown", function (e) {
        // Ctrl/Cmd + Enter avanza de paso si estamos en el wizard
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            const screenWizard = document.getElementById("screen-wizard");
            if (screenWizard && !screenWizard.classList.contains("hidden")) {
                pasoSiguiente();
            }
        }
        // Esc cierra el modal si está abierto
        if (e.key === "Escape") {
            const modal = document.getElementById("modal-ai");
            if (modal && !modal.classList.contains("hidden")) {
                cerrarModalIA();
            }
        }
    });
});

// Cambiar Idioma
function cambiarIdioma(lang) {
    currentLang = lang;
    aplicarTraduccionesUI();
    if (!document.getElementById("screen-wizard").classList.contains("hidden")) {
        renderizarPasoWizard();
    } else if (!document.getElementById("screen-result").classList.contains("hidden")) {
        mostrarPantallaResultado();
    }
}

function aplicarTraduccionesUI() {
    const t = TRANSLATIONS[currentLang];
    
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setTxt("ui-subtitle", t.ui_subtitle);
    setTxt("lbl-reset", t.lbl_reset);
    setTxt("lbl-tag-intro", t.lbl_tag_intro);
    setTxt("title-intro", t.title_intro);
    setTxt("desc-intro", t.desc_intro);
    
    const inputIdea = document.getElementById("input-idea");
    if (inputIdea) inputIdea.placeholder = t.input_idea_placeholder;

    setTxt("lbl-sample", t.btn_sample);
    setTxt("lbl-start", t.btn_start);
    setTxt("lbl-prev", t.lbl_prev);
    setTxt("lbl-next", t.lbl_next);
    setTxt("title-result", t.title_result);
    setTxt("desc-result", t.desc_result);
    setTxt("lbl-edit", t.lbl_edit);
    setTxt("lbl-ai", t.lbl_ai);
    setTxt("title-checklist", t.title_checklist);
    setTxt("lbl-copy", t.lbl_copy);
    setTxt("title-files", t.title_files);
    setTxt("lbl-download-zip", t.lbl_download_zip);
    setTxt("lbl-download-md", t.lbl_download_md);
    setTxt("lbl-footer", t.lbl_footer);
    setTxt("title-modal-ai", t.title_modal_ai);
    setTxt("desc-modal-ai", t.desc_modal_ai);
    setTxt("btn-close-modal", t.lbl_close_modal);
    setTxt("lbl-copy-modal", t.lbl_copy_modal);

    setTxt("tab-label-preview", t.tab_preview);
    setTxt("tab-label-structure", t.tab_structure);
    setTxt("tab-label-install", t.tab_install);
    setTxt("presets-header-title", t.presets_title);

    setTxt("preset-lbl-meeting", t.preset_meeting);
    setTxt("preset-lbl-code", t.preset_code);
    setTxt("preset-lbl-seo", t.preset_seo);
    setTxt("preset-lbl-data", t.preset_data);

    if (currentStep === TOTAL_PASOS) {
        setTxt("lbl-next", t.lbl_finish);
    }
}

// Cargar Preset de plantilla prediseñada
function cargarPreset(tipo) {
    if (PRESETS[tipo]) {
        appState = JSON.parse(JSON.stringify(PRESETS[tipo]));
        document.getElementById("input-idea").value = appState.ideaInicial;
        guardarBorradorLocal();
        mostrarToast(`Plantilla "${PRESETS[tipo].nombre}" cargada con éxito`, "check-circle");
        comenzarWizard();
    }
}

// Carga Skill de Muestra por defecto
function cargarEjemploMuestra() {
    cargarPreset("meeting");
}

// Iniciar Wizard
function comenzarWizard() {
    const inputIdea = document.getElementById("input-idea");
    const ideaText = inputIdea ? inputIdea.value.trim() : "";
    
    if (ideaText) {
        appState.ideaInicial = ideaText;
        if (!appState.nombre || appState.nombre.trim().length === 0) {
            const primeraPalabra = ideaText.split(" ")[0].toLowerCase();
            appState.nombre = sanitizarNombreSkill(`${primeraPalabra}-skill`);
        }
    }

    guardarBorradorLocal();

    document.getElementById("screen-intro").classList.add("hidden");
    document.getElementById("screen-wizard").classList.remove("hidden");
    document.getElementById("screen-result").classList.add("hidden");
    
    currentStep = 1;
    renderizarPasoWizard();
}

// Navegación Wizard
function pasoAnterior() {
    if (currentStep > 1) {
        currentStep = currentStep - 1;
        renderizarPasoWizard();
    } else {
        document.getElementById("screen-wizard").classList.add("hidden");
        document.getElementById("screen-intro").classList.remove("hidden");
    }
}

function pasoSiguiente() {
    if (currentStep < TOTAL_PASOS) {
        currentStep = currentStep + 1;
        renderizarPasoWizard();
    } else {
        mostrarPantallaResultado();
    }
}

// Renderizar Resultado Final
function mostrarPantallaResultado() {
    // Validar nombre
    if (!appState.nombre || appState.nombre.trim().length === 0) {
        appState.nombre = "mi-skill";
    }
    appState.nombre = sanitizarNombreSkill(appState.nombre);
    guardarBorradorLocal();

    document.getElementById("screen-wizard").classList.add("hidden");
    document.getElementById("screen-result").classList.remove("hidden");

    // Markdown
    const markdown = construirMarkdownSkill();
    document.getElementById("preview-markdown").innerText = markdown;

    // Advertencia de líneas
    const totalLineas = markdown.split("\n").length;
    const warningBox = document.getElementById("warning-box");
    if (totalLineas > 500) {
        warningBox.classList.remove("hidden");
        document.getElementById("warning-box-text").innerText = `El SKILL.md tiene ${totalLineas} líneas. Se recomienda no superar las 500 líneas moviendo detalles a la carpeta references/.`;
    } else {
        warningBox.classList.add("hidden");
    }

    // Checklist y Puntuación
    const checklist = evaluarCalidad();
    const puntuacion = calcularPuntuacionCalidad(checklist);

    // Render indicador de puntuación
    const scoreBadge = document.getElementById("quality-score-badge");
    const scorePercent = document.getElementById("quality-score-percent");
    if (scorePercent) scorePercent.innerText = `${puntuacion}%`;

    if (scoreBadge) {
        if (puntuacion >= 90) {
            scoreBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800";
            scoreBadge.innerText = "Excelente Calidad";
        } else if (puntuacion >= 70) {
            scoreBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800";
            scoreBadge.innerText = "Buena - Mejorable";
        } else {
            scoreBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800";
            scoreBadge.innerText = "Incompleta";
        }
    }

    let htmlCheck = "";
    checklist.forEach(item => {
        const icon = item.valido 
            ? `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 shrink-0"></i>` 
            : `<i data-lucide="alert-circle" class="w-4 h-4 text-amber-500 shrink-0"></i>`;
        
        htmlCheck += `
            <div class="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E8E2D5] ${item.valido ? 'bg-white' : 'bg-amber-50/60'}">
                ${icon}
                <span class="${item.valido ? 'text-[#2D2A26]' : 'text-[#706B63] font-medium'} text-xs">${item.label}</span>
            </div>
        `;
    });
    document.getElementById("quality-checklist").innerHTML = htmlCheck;

    // Árbol de carpetas
    document.getElementById("folder-tree").innerText = generarArbolCarpetas();

    // Guía de instalación
    document.getElementById("install-guide-content").innerHTML = renderizarMarkdownSimple(generarGuiaInstalacion());

    // Activar pestaña por defecto
    cambiarTabResultado(tabResultadoActivo || "preview");

    lucide.createIcons();
}

// Cambio de Pestañas en la pantalla de resultado
function cambiarTabResultado(tab) {
    tabResultadoActivo = tab;
    const tabPreview = document.getElementById("tab-content-preview");
    const tabStructure = document.getElementById("tab-content-structure");
    const tabInstall = document.getElementById("tab-content-install");

    const btnPreview = document.getElementById("btn-tab-preview");
    const btnStructure = document.getElementById("btn-tab-structure");
    const btnInstall = document.getElementById("btn-tab-install");

    // Ocultar todos
    if (tabPreview) tabPreview.classList.add("hidden");
    if (tabStructure) tabStructure.classList.add("hidden");
    if (tabInstall) tabInstall.classList.add("hidden");

    if (btnPreview) btnPreview.classList.remove("active");
    if (btnStructure) btnStructure.classList.remove("active");
    if (btnInstall) btnInstall.classList.remove("active");

    if (tab === "preview" && tabPreview && btnPreview) {
        tabPreview.classList.remove("hidden");
        btnPreview.classList.add("active");
    } else if (tab === "structure" && tabStructure && btnStructure) {
        tabStructure.classList.remove("hidden");
        btnStructure.classList.add("active");
    } else if (tab === "install" && tabInstall && btnInstall) {
        tabInstall.classList.remove("hidden");
        btnInstall.classList.add("active");
    }
}

function volverAlWizard() {
    document.getElementById("screen-result").classList.add("hidden");
    document.getElementById("screen-wizard").classList.remove("hidden");
    renderizarPasoWizard();
}

// Copiar Markdown
async function copiarMarkdown() {
    const md = construirMarkdownSkill();
    const ok = await copiarAlPortapapeles(md);
    if (ok) {
        mostrarToast(TRANSLATIONS[currentLang].msg_copied, "check");
    }
}

// Descargar solo el archivo SKILL.md
function descargarSoloMarkdown() {
    const md = construirMarkdownSkill();
    descargarArchivoTexto("SKILL.md", md);
    mostrarToast("SKILL.md descargado", "download");
}

// Prompt para Claude
function generarPromptIA() {
    const md = construirMarkdownSkill();
    const prompt = `Hola Claude, estoy diseñando una Skill especializada para ti. A continuación te adjunto el borrador actual:\n\n\`\`\`markdown\n${md}\n\`\`\`\n\nPor favor, como experto en diseño de agentes e instrucciones Claude:\n1. Revisa la etiqueta 'description' en el frontmatter YAML: ¿contiene claramente en 3ª persona tanto el 'qué hace' como los 'triggers exactos de activación'?\n2. Identifica si hay ambigüedades, directrices contradictorias o reglas ausentes.\n3. Evalúa si el flujo paso a paso es suficientemente determinista.\n4. Recomienda si algún detalle excesivo debería delegarse a archivos en references/ o scripts/.\n5. Devuélveme una versión optimizada y pulida del SKILL.md.`;
    
    document.getElementById("ai-prompt-text").value = prompt;
    document.getElementById("modal-ai").classList.remove("hidden");
    lucide.createIcons();
}

function cerrarModalIA() {
    document.getElementById("modal-ai").classList.add("hidden");
}

async function copiarPromptIA() {
    const txt = document.getElementById("ai-prompt-text").value;
    const ok = await copiarAlPortapapeles(txt);
    if (ok) {
        mostrarToast(TRANSLATIONS[currentLang].msg_copied, "check");
    }
}

// Generación y descarga del archivo ZIP
function descargarZip() {
    const zip = new JSZip();
    const nombreCarpeta = sanitizarNombreSkill(appState.nombre) || "mi-skill";
    const folder = zip.folder(nombreCarpeta);

    // Añadir SKILL.md en la raíz de la skill
    folder.file("SKILL.md", construirMarkdownSkill());

    // Añadir archivos adicionales
    appState.archivosExtra.forEach(extra => {
        if (extra.nombre && extra.nombre.trim().length > 0) {
            folder.file(`${extra.tipo}/${extra.nombre.trim()}`, extra.contenido || "");
        }
    });

    // Generar archivo binario zip y descargar
    zip.generateAsync({ type: "blob" }).then(function (content) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = `${nombreCarpeta}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        mostrarToast(`Paquete ${nombreCarpeta}.zip descargado`, "package");
    });
}

// Reiniciar app
function confirmarReiniciar() {
    if (confirm(TRANSLATIONS[currentLang].msg_confirm_reset)) {
        reiniciarBorrador();
        mostrarToast("Borrador restablecido", "rotate-ccw");
    }
}

function reiniciarBorrador() {
    limpiarBorradorLocal();
    appState = {
        ideaInicial: "",
        nombre: "",
        queHace: "",
        cuandoActivar: "",
        cuandoNoActivar: "",
        entradas: "",
        salidas: "",
        pasos: [""],
        reglas: [""],
        ejemplos: [{ entrada: "", salida: "" }],
        casosLimite: "",
        archivosExtra: []
    };
    
    const inputIdea = document.getElementById("input-idea");
    if (inputIdea) inputIdea.value = "";
    document.getElementById("screen-wizard").classList.add("hidden");
    document.getElementById("screen-result").classList.add("hidden");
    document.getElementById("screen-intro").classList.remove("hidden");
}

// Parser simple y seguro para renderizar Markdown ligero (encabezados, listas, citas, código)
function renderizarMarkdownSimple(md) {
    if (!md) return "";
    let html = md
        .replace(/### (.*)/g, '<h4 class="font-bold text-sm text-[#1A1816] mt-3 mb-1.5">$1</h4>')
        .replace(/#### (.*)/g, '<h5 class="font-bold text-xs uppercase tracking-wide text-[#706B63] mt-3 mb-1">$1</h5>')
        .replace(/> (.*)/g, '<blockquote class="border-l-2 border-[#D97757] pl-3 py-1 my-2 text-xs italic text-[#706B63] bg-[#F7F3E9]/50 rounded-r">$1</blockquote>')
        .replace(/`([^`]+)`/g, '<code class="bg-[#F7F3E9] px-1.5 py-0.5 rounded text-[11px] font-mono text-[#D97757]">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<div class="h-2"></div>')
        .replace(/\n- (.*)/g, '<li class="ml-4 list-disc text-xs text-[#2D2A26] my-0.5">$1</li>')
        .replace(/\n\d+\. (.*)/g, '<li class="ml-4 list-decimal text-xs text-[#2D2A26] my-0.5">$1</li>');
    return html;
}
