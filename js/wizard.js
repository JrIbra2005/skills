// Lógica de renders y controles del Asistente Wizard (Pasos)

const TOTAL_PASOS = 10;

const PASOS_CONFIG = [
    { num: 1, key: "nombre", icon: "tag", label: "Nombre" },
    { num: 2, key: "queHace", icon: "activity", label: "Propósito" },
    { num: 3, key: "cuandoActivar", icon: "zap", label: "Cuándo activar" },
    { num: 4, key: "cuandoNoActivar", icon: "slash", label: "Cuándo NO" },
    { num: 5, key: "entradas", icon: "arrow-down-right", label: "Entradas" },
    { num: 6, key: "salidas", icon: "arrow-up-right", label: "Salidas" },
    { num: 7, key: "pasos", icon: "list-ordered", label: "Proceso" },
    { num: 8, key: "reglas", icon: "shield-alert", label: "Reglas" },
    { num: 9, key: "ejemplos", icon: "code-2", label: "Ejemplos" },
    { num: 10, key: "recursos", icon: "folder-plus", label: "Recursos" }
];

// Salta directamente a un paso seleccionado
function saltarAPaso(num) {
    if (num >= 1 && num <= TOTAL_PASOS) {
        currentStep = num;
        renderizarPasoWizard();
        actualizarBotonSiguienteTexto();
    }
}

// Renderiza la barra de navegación con pills de todos los pasos
function renderizarStepperNav() {
    const contenedor = document.getElementById("wizard-stepper-nav");
    if (!contenedor) return;

    let html = "";
    PASOS_CONFIG.forEach(cfg => {
        const esActual = cfg.num === currentStep;
        const esCompletado = cfg.num < currentStep;
        let estadoClase = "pending";
        if (esActual) estadoClase = "active";
        else if (esCompletado) estadoClase = "completed";

        const iconHtml = esCompletado
            ? `<i data-lucide="check" class="w-3 h-3 text-[#D97757]"></i>`
            : `<span class="text-[10px] font-mono">${cfg.num}</span>`;

        html += `
            <button onclick="saltarAPaso(${cfg.num})" class="step-nav-pill ${estadoClase}" title="${cfg.label}">
                ${iconHtml}
                <span>${cfg.label}</span>
            </button>
        `;
    });

    contenedor.innerHTML = html;
}

// Renderiza el contenido correspondiente al paso actual
function renderizarPasoWizard() {
    const contenedor = document.getElementById("wizard-step-content");
    let html = "";

    // Actualiza barra e indicadores superiores
    const porcentaje = Math.round((currentStep / TOTAL_PASOS) * 100);
    const labelStep = document.getElementById("wizard-step-label");
    const labelPercent = document.getElementById("wizard-progress-percent");
    const bar = document.getElementById("progress-bar");

    if (labelStep) labelStep.innerText = `${TRANSLATIONS[currentLang].wizard_step_prefix} ${currentStep} ${TRANSLATIONS[currentLang].wizard_step_of} ${TOTAL_PASOS}`;
    if (labelPercent) labelPercent.innerText = `${porcentaje}%`;
    if (bar) bar.style.width = `${porcentaje}%`;

    // Renderizar stepper interactivo
    renderizarStepperNav();

    // Renderizado según número de paso
    if (currentStep === 1) {
        const sanitized = sanitizarNombreSkill(appState.nombre);
        const tieneCaracteresInvalidos = appState.nombre && appState.nombre !== sanitized;

        html = `
            <div class="space-y-4">
                <div>
                    <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 1 de 10 &bull; Identificador</span>
                    <label class="block text-base font-bold text-[#1A1816]">1. Nombre único de la Skill</label>
                    <p class="text-xs text-[#706B63] mt-1">Este será el nombre del directorio y el identificador en el frontmatter YAML de Claude (máx. 64 caracteres, solo minúsculas y guiones).</p>
                </div>

                <div class="space-y-2">
                    <input type="text" id="wizard-nombre" class="claude-input w-full p-3.5 text-sm font-mono" value="${escaparHtml(appState.nombre)}" placeholder="ej. auditor-codigo-seguridad" oninput="actualizarNombreEstado(this.value)">
                    
                    <div class="flex items-center justify-between text-xs pt-1">
                        <div class="flex items-center gap-2">
                            <span class="text-[#706B63]">Directorio generado:</span>
                            <span id="slug-preview" class="font-mono bg-[#F7F3E9] px-2 py-0.5 rounded text-[#D97757] font-semibold">${sanitized || "mi-skill"}</span>
                        </div>
                        <span class="text-[11px] text-[#706B63]">${(appState.nombre || "").length}/64 caracteres</span>
                    </div>

                    ${tieneCaracteresInvalidos ? `
                        <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                            <i data-lucide="info" class="w-4 h-4 shrink-0"></i>
                            <span>Los espacios y acentos se transforman automáticamente a formato kebab-case estándar.</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (currentStep === 2) {
        html = `
            <div class="space-y-4">
                <div>
                    <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 2 de 10 &bull; Función</span>
                    <label class="block text-base font-bold text-[#1A1816]">2. ¿Qué hace esta Skill?</label>
                    <p class="text-xs text-[#706B63] mt-1">Sintetiza la misión principal de la skill. Claude usará esto para evaluar si su capacidad se alinea con la tarea solicitada.</p>
                </div>
                <textarea id="wizard-queHace" rows="4" class="claude-input w-full p-3.5 text-sm leading-relaxed" placeholder="Ejemplo: Audita snippets de código o repositorios detectando vulnerabilidades de seguridad OWASP y violaciones de Clean Code, proponiendo versiones corregidas." oninput="appState.queHace = this.value; guardarBorradorLocal(); actualizarLivePreviewSiActivo();">${escaparHtml(appState.queHace)}</textarea>
                <div class="flex items-center justify-between text-[11px] text-[#706B63]">
                    <span>Consejo: Redacta en tercera persona comenzando con un verbo activo (ej. "Genera...", "Analiza...", "Traduce...").</span>
                    <span>${(appState.queHace || "").length} caracteres</span>
                </div>
            </div>
        `;
    } else if (currentStep === 3) {
        html = `
            <div class="space-y-4">
                <div>
                    <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 3 de 10 &bull; Activación</span>
                    <label class="block text-base font-bold text-[#1A1816]">3. ¿Cuándo debería activarse?</label>
                    <p class="text-xs text-[#706B63] mt-1">Escribe los disparadores ("triggers"): frases, peticiones o palabras clave típicas del usuario que deben activar la skill.</p>
                </div>
                <textarea id="wizard-cuandoActivar" rows="4" class="claude-input w-full p-3.5 text-sm leading-relaxed" placeholder="Ejemplo: Cuando el usuario diga 'Revisa la seguridad de este archivo', 'Haz un code review' o comparta un fragmento de código pidiendo auditoría." oninput="appState.cuandoActivar = this.value; guardarBorradorLocal(); actualizarLivePreviewSiActivo();">${escaparHtml(appState.cuandoActivar)}</textarea>
                <div class="flex items-center justify-between text-[11px] text-[#706B63]">
                    <span>Esta información se integrará en el frontmatter <code class="bg-[#F7F3E9] px-1 rounded font-mono">description:</code> para que Claude la descubra automáticamente.</span>
                </div>
            </div>
        `;
    } else if (currentStep === 4) {
        html = `
            <div class="space-y-4">
                <div>
                    <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 4 de 10 &bull; Delimitación</span>
                    <label class="block text-base font-bold text-[#1A1816]">4. ¿Cuándo NO debería activarse?</label>
                    <p class="text-xs text-[#706B63] mt-1">Delimita claramente los límites y exclusiones para evitar que Claude sobreactive esta skill en tareas no relacionadas.</p>
                </div>
                <textarea id="wizard-cuandoNoActivar" rows="4" class="claude-input w-full p-3.5 text-sm leading-relaxed" placeholder="Ejemplo: NO usar para escribir documentación general sin código, ni para peticiones de redacción de emails o resolución de dudas teóricas que no impliquen análisis de código." oninput="appState.cuandoNoActivar = this.value; guardarBorradorLocal(); actualizarLivePreviewSiActivo();">${escaparHtml(appState.cuandoNoActivar)}</textarea>
                <div class="text-[11px] text-[#706B63]">
                    <span>Consejo: Definir límites negativos reduce alucinaciones y llamadas innecesarias.</span>
                </div>
            </div>
        `;
    } else if (currentStep === 5) {
        html = `
            <div class="space-y-4">
                <div>
                    <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 5 de 10 &bull; Inputs</span>
                    <label class="block text-base font-bold text-[#1A1816]">5. Entradas y Datos Necesarios</label>
                    <p class="text-xs text-[#706B63] mt-1">¿Qué información, parámetros o archivos espera recibir Claude para poder completar la tarea?</p>
                </div>
                <textarea id="wizard-entradas" rows="4" class="claude-input w-full p-3.5 text-sm leading-relaxed" placeholder="Ejemplo: Snippet de código fuente o ruta del archivo, lenguaje de programación (opcional si es deducible) y requisitos específicos de rendimiento." oninput="appState.entradas = this.value; guardarBorradorLocal(); actualizarLivePreviewSiActivo();">${escaparHtml(appState.entradas)}</textarea>
            </div>
        `;
    } else if (currentStep === 6) {
        html = `
            <div class="space-y-4">
                <div>
                    <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 6 de 10 &bull; Outputs</span>
                    <label class="block text-base font-bold text-[#1A1816]">6. Formato de Salida Esperado</label>
                    <p class="text-xs text-[#706B63] mt-1">Describe con exactitud la estructura, formato (Markdown, JSON, tablas), tono y nivel de detalle de la respuesta.</p>
                </div>
                <textarea id="wizard-salidas" rows="4" class="claude-input w-full p-3.5 text-sm leading-relaxed" placeholder="Ejemplo: Documento Markdown con: Resumen del análisis, Tabla de vulnerabilidades encontradas (Gravedad, Ubicación, Descripción), Código corregido y recomendaciones." oninput="appState.salidas = this.value; guardarBorradorLocal(); actualizarLivePreviewSiActivo();">${escaparHtml(appState.salidas)}</textarea>
            </div>
        `;
    } else if (currentStep === 7) {
        html = renderizarListaEditablePasos();
    } else if (currentStep === 8) {
        html = renderizarListaEditableReglas();
    } else if (currentStep === 9) {
        html = renderizarListaEditableEjemplos();
    } else if (currentStep === 10) {
        html = renderizarPasoArchivosYCasos();
    }

    contenedor.innerHTML = html;
    lucide.createIcons();
    actualizarBotonSiguienteTexto();
    actualizarLivePreviewSiActivo();
}

function actualizarBotonSiguienteTexto() {
    const btnNext = document.getElementById("lbl-next");
    if (!btnNext) return;
    if (currentStep === TOTAL_PASOS) {
        btnNext.innerText = TRANSLATIONS[currentLang].lbl_finish;
    } else {
        btnNext.innerText = TRANSLATIONS[currentLang].lbl_next;
    }
}

// Actualiza el nombre sanitizado en tiempo real
function actualizarNombreEstado(val) {
    appState.nombre = val;
    const preview = document.getElementById("slug-preview");
    if (preview) {
        preview.innerText = sanitizarNombreSkill(val) || "mi-skill";
    }
    guardarBorradorLocal();
    actualizarLivePreviewSiActivo();
}

// Renderiza la lista editable de pasos (Paso 7)
function renderizarListaEditablePasos() {
    let html = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 7 de 10 &bull; Flujo</span>
                    <label class="block text-base font-bold text-[#1A1816]">7. Proceso Paso a Paso</label>
                    <p class="text-xs text-[#706B63] mt-1">Secuencia ordenada de acciones que Claude debe ejecutar de principio a fin.</p>
                </div>
                <button onclick="agregarPaso()" class="claude-btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm">
                    <i data-lucide="plus" class="w-3.5 h-3.5 text-[#D97757]"></i> Añadir paso
                </button>
            </div>
            <div class="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
    `;

    appState.pasos.forEach((paso, i) => {
        html += `
            <div class="flex items-center gap-2 p-1.5 rounded-xl bg-[#F7F3E9]/50 border border-[#E8E2D5]">
                <span class="text-xs font-mono font-bold text-[#706B63] w-6 text-center shrink-0">${i + 1}.</span>
                <input type="text" class="claude-input flex-1 p-2 text-sm" value="${escaparHtml(paso)}" placeholder="Ej. Analizar la estructura sintáctica y dependencias del archivo" oninput="modificarPaso(${i}, this.value)">
                <div class="flex items-center gap-1 shrink-0">
                    <button onclick="moverPaso(${i}, -1)" class="p-1.5 text-[#706B63] hover:text-[#1A1816] rounded hover:bg-[#EFE9DB]" title="Subir"><i data-lucide="arrow-up" class="w-3.5 h-3.5"></i></button>
                    <button onclick="moverPaso(${i}, 1)" class="p-1.5 text-[#706B63] hover:text-[#1A1816] rounded hover:bg-[#EFE9DB]" title="Bajar"><i data-lucide="arrow-down" class="w-3.5 h-3.5"></i></button>
                    <button onclick="eliminarPaso(${i})" class="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50" title="Eliminar"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    return html;
}

function agregarPaso() {
    appState.pasos.push("");
    guardarBorradorLocal();
    renderizarPasoWizard();
}

function modificarPaso(idx, val) {
    appState.pasos[idx] = val;
    guardarBorradorLocal();
    actualizarLivePreviewSiActivo();
}

function eliminarPaso(idx) {
    if (appState.pasos.length > 1) {
        appState.pasos.splice(idx, 1);
    } else {
        appState.pasos[0] = "";
    }
    guardarBorradorLocal();
    renderizarPasoWizard();
}

function moverPaso(idx, direccion) {
    const nuevoIdx = idx + direccion;
    if (nuevoIdx >= 0 && nuevoIdx < appState.pasos.length) {
        const temp = appState.pasos[idx];
        appState.pasos[idx] = appState.pasos[nuevoIdx];
        appState.pasos[nuevoIdx] = temp;
        guardarBorradorLocal();
        renderizarPasoWizard();
    }
}

// Renderiza lista editable de Reglas (Paso 8)
function renderizarListaEditableReglas() {
    let html = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 8 de 10 &bull; Directrices</span>
                    <label class="block text-base font-bold text-[#1A1816]">8. Reglas y Restricciones Obligatorias</label>
                    <p class="text-xs text-[#706B63] mt-1">Líneas rojas que Claude jamás debe transgredir durante la ejecución.</p>
                </div>
                <button onclick="agregarRegla()" class="claude-btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm">
                    <i data-lucide="plus" class="w-3.5 h-3.5 text-[#D97757]"></i> Añadir regla
                </button>
            </div>
            <div class="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
    `;

    appState.reglas.forEach((regla, i) => {
        html += `
            <div class="flex items-center gap-2 p-1.5 rounded-xl bg-[#F7F3E9]/50 border border-[#E8E2D5]">
                <span class="text-sm font-bold text-[#D97757] w-6 text-center shrink-0">&bull;</span>
                <input type="text" class="claude-input flex-1 p-2 text-sm" value="${escaparHtml(regla)}" placeholder="Ej. Nunca asumir acuerdos no explícitos ni omitir comprobaciones críticas" oninput="modificarRegla(${i}, this.value)">
                <button onclick="eliminarRegla(${i})" class="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 shrink-0" title="Eliminar"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
        `;
    });

    html += `</div></div>`;
    return html;
}

function agregarRegla() {
    appState.reglas.push("");
    guardarBorradorLocal();
    renderizarPasoWizard();
}

function modificarRegla(idx, val) {
    appState.reglas[idx] = val;
    guardarBorradorLocal();
    actualizarLivePreviewSiActivo();
}

function eliminarRegla(idx) {
    if (appState.reglas.length > 1) {
        appState.reglas.splice(idx, 1);
    } else {
        appState.reglas[0] = "";
    }
    guardarBorradorLocal();
    renderizarPasoWizard();
}

// Renderiza lista editable de Ejemplos (Paso 9)
function renderizarListaEditableEjemplos() {
    let html = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 9 de 10 &bull; Few-Shot</span>
                    <label class="block text-base font-bold text-[#1A1816]">9. Ejemplos Prácticos Demostrativos</label>
                    <p class="text-xs text-[#706B63] mt-1">Los ejemplos son el mecanismo más potente para enseñar a Claude el formato y calidad esperados.</p>
                </div>
                <button onclick="agregarEjemplo()" class="claude-btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm">
                    <i data-lucide="plus" class="w-3.5 h-3.5 text-[#D97757]"></i> Añadir ejemplo
                </button>
            </div>
            <div class="space-y-4 max-h-[310px] overflow-y-auto pr-1">
    `;

    appState.ejemplos.forEach((ej, i) => {
        html += `
            <div class="p-4 rounded-xl border border-[#E8E2D5] bg-[#F7F3E9]/60 space-y-3 relative">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[#D97757] flex items-center gap-1.5">
                        <i data-lucide="code-2" class="w-3.5 h-3.5"></i> Ejemplo #${i + 1}
                    </span>
                    ${appState.ejemplos.length > 1 ? `<button onclick="eliminarEjemplo(${i})" class="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Eliminar</button>` : ''}
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-[#706B63] mb-1">Entrada de muestra (Prompt / Texto del usuario):</label>
                    <textarea rows="2" class="claude-input w-full p-2.5 text-xs font-mono" placeholder="Ej. Notas de la reunión: Carlos entrega el martes..." oninput="modificarEjemplo(${i}, 'entrada', this.value)">${escaparHtml(ej.entrada)}</textarea>
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-[#706B63] mb-1">Salida esperada (Respuesta óptima de Claude):</label>
                    <textarea rows="2" class="claude-input w-full p-2.5 text-xs font-mono" placeholder="Ej. ## Acta de Reunión&#10;- Acuerdo: Carlos entrega el martes..." oninput="modificarEjemplo(${i}, 'salida', this.value)">${escaparHtml(ej.salida)}</textarea>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    return html;
}

function agregarEjemplo() {
    appState.ejemplos.push({ entrada: "", salida: "" });
    guardarBorradorLocal();
    renderizarPasoWizard();
}

function modificarEjemplo(idx, campo, val) {
    appState.ejemplos[idx][campo] = val;
    guardarBorradorLocal();
    actualizarLivePreviewSiActivo();
}

function eliminarEjemplo(idx) {
    if (appState.ejemplos.length > 1) {
        appState.ejemplos.splice(idx, 1);
    } else {
        appState.ejemplos[0] = { entrada: "", salida: "" };
    }
    guardarBorradorLocal();
    renderizarPasoWizard();
}

// Renderiza Paso 10: Casos límite y Archivos Extra
function renderizarPasoArchivosYCasos() {
    let html = `
        <div class="space-y-5">
            <div>
                <span class="badge-tag bg-[#FBF0EB] text-[#D97757] mb-2">Paso 10 de 10 &bull; Recursos & Robustez</span>
                <label class="block text-base font-bold text-[#1A1816]">10. Casos Límite y Archivos de Soporte</label>
                <p class="text-xs text-[#706B63] mt-1">Manejo de situaciones excepcionales y empaquetado de scripts o plantillas de referencia.</p>
            </div>

            <div class="space-y-2">
                <label class="block text-xs font-semibold text-[#1A1816]">Casos límite o resolución ante datos incompletos:</label>
                <textarea rows="3" class="claude-input w-full p-3 text-xs leading-relaxed" placeholder="Ej. Si el usuario no proporciona el archivo fuente o falta información crítica, pausar y pedir la aclaración antes de continuar." oninput="appState.casosLimite = this.value; guardarBorradorLocal(); actualizarLivePreviewSiActivo();">${escaparHtml(appState.casosLimite)}</textarea>
            </div>

            <div class="border-t border-[#E8E2D5] pt-4">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <span class="text-xs font-bold text-[#1A1816]">Archivos adicionales (scripts/, references/, assets/)</span>
                        <p class="text-[11px] text-[#706B63]">Recomendado para esquemas, scripts Python/Bash o plantillas corporativas.</p>
                    </div>
                    <button onclick="agregarArchivoExtra()" class="claude-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                        <i data-lucide="file-plus" class="w-3.5 h-3.5 text-[#D97757]"></i> Añadir archivo
                    </button>
                </div>
                <div class="space-y-3 max-h-[180px] overflow-y-auto pr-1">
    `;

    if (appState.archivosExtra.length === 0) {
        html += `
            <div class="p-3 text-center rounded-xl border border-dashed border-[#E8E2D5] text-[#706B63] text-xs">
                No hay archivos extra configurados (opcional). El paquete contendrá únicamente <span class="font-mono text-[#1A1816]">SKILL.md</span>.
            </div>
        `;
    }

    appState.archivosExtra.forEach((file, i) => {
        html += `
            <div class="p-3 rounded-xl border border-[#E8E2D5] bg-[#F7F3E9]/50 space-y-2">
                <div class="flex items-center gap-2">
                    <select onchange="modificarArchivoExtra(${i}, 'tipo', this.value)" class="bg-[#FFFFFF] border border-[#E8E2D5] text-xs rounded-lg p-2 font-medium">
                        <option value="references" ${file.tipo === 'references' ? 'selected' : ''}>references/</option>
                        <option value="scripts" ${file.tipo === 'scripts' ? 'selected' : ''}>scripts/</option>
                        <option value="assets" ${file.tipo === 'assets' ? 'selected' : ''}>assets/</option>
                    </select>
                    <input type="text" class="claude-input flex-1 p-2 text-xs font-mono" value="${escaparHtml(file.nombre)}" placeholder="nombre-archivo.md" oninput="modificarArchivoExtra(${i}, 'nombre', this.value)">
                    <button onclick="eliminarArchivoExtra(${i})" class="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
                <textarea rows="2" class="claude-input w-full p-2 text-xs font-mono" placeholder="Contenido del archivo..." oninput="modificarArchivoExtra(${i}, 'contenido', this.value)">${escaparHtml(file.contenido)}</textarea>
            </div>
        `;
    });

    html += `</div></div></div>`;
    return html;
}

function agregarArchivoExtra() {
    appState.archivosExtra.push({ tipo: "references", nombre: "documento-referencia.md", contenido: "" });
    guardarBorradorLocal();
    renderizarPasoWizard();
}

function modificarArchivoExtra(idx, campo, val) {
    appState.archivosExtra[idx][campo] = val;
    guardarBorradorLocal();
    actualizarLivePreviewSiActivo();
}

function eliminarArchivoExtra(idx) {
    appState.archivosExtra.splice(idx, 1);
    guardarBorradorLocal();
    renderizarPasoWizard();
}

// Live Preview durante el wizard
function alternarLivePreview() {
    livePreviewActivo = !livePreviewActivo;
    const panel = document.getElementById("wizard-live-preview");
    const btnTexto = document.getElementById("lbl-toggle-preview");

    if (panel) {
        if (livePreviewActivo) {
            panel.classList.remove("hidden");
            actualizarLivePreviewSiActivo();
            if (btnTexto) btnTexto.innerText = TRANSLATIONS[currentLang].toggle_preview_hide;
        } else {
            panel.classList.add("hidden");
            if (btnTexto) btnTexto.innerText = TRANSLATIONS[currentLang].toggle_preview_show;
        }
    }
}

function actualizarLivePreviewSiActivo() {
    if (!livePreviewActivo) return;
    const pre = document.getElementById("wizard-preview-pre");
    if (pre) {
        pre.innerText = construirMarkdownSkill();
    }
}
