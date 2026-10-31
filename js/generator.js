// Generación de SKILL.md, prompts, árbol de carpetas y guía de instalación

// Construye la descripción en tercera persona combinando qué hace y cuándo usarla
function generarDescripcionGenerada() {
    let desc = "";
    const que = appState.queHace ? appState.queHace.trim() : "";
    const cuando = appState.cuandoActivar ? appState.cuandoActivar.trim() : "";

    if (que.length > 0 && cuando.length > 0) {
        // Asegura redacción en 3ra persona y formato óptimo para el trigger de Claude
        const queLimpio = que.charAt(0).toLowerCase() + que.slice(1);
        const cuandoLimpio = cuando.charAt(0).toLowerCase() + cuando.slice(1);
        desc = `Esta skill ${queLimpio} Usar cuando ${cuandoLimpio}`;
    } else if (que.length > 0) {
        desc = `Esta skill ${que.charAt(0).toLowerCase() + que.slice(1)}`;
    } else if (cuando.length > 0) {
        desc = `Usar cuando ${cuando.charAt(0).toLowerCase() + cuando.slice(1)}`;
    } else {
        desc = "Skill especializada para Claude.";
    }

    if (desc.length > 1024) {
        desc = desc.substring(0, 1020) + "...";
    }

    return desc;
}

// Genera el contenido Markdown completo del SKILL.md siguiendo el estándar oficial de Claude
function construirMarkdownSkill() {
    let md = "";
    const nombreFolder = sanitizarNombreSkill(appState.nombre) || "mi-skill";
    const descripcion = generarDescripcionGenerada();

    // Frontmatter YAML estándar para descubrimiento de skills
    md += "---\n";
    md += `name: ${nombreFolder}\n`;
    md += `description: ${descripcion}\n`;
    md += "---\n\n";

    // 1. Propósito principal
    if (appState.queHace && appState.queHace.trim().length > 0) {
        md += `## Propósito y Función\n${appState.queHace.trim()}\n\n`;
    }

    // 2. Cuándo usar (Triggers de activación)
    if (appState.cuandoActivar && appState.cuandoActivar.trim().length > 0) {
        md += `## Cuándo Usar esta Skill\n${appState.cuandoActivar.trim()}\n\n`;
    }

    // 3. Cuándo NO usar (Límites para evitar sobreactivación)
    if (appState.cuandoNoActivar && appState.cuandoNoActivar.trim().length > 0) {
        md += `## Cuándo NO Usar\n${appState.cuandoNoActivar.trim()}\n\n`;
    }

    // 4. Entradas esperadas
    if (appState.entradas && appState.entradas.trim().length > 0) {
        md += `## Entradas Requeridas\n${appState.entradas.trim()}\n\n`;
    }

    // 5. Flujo o proceso paso a paso
    const pasosValidos = appState.pasos.filter(p => p && p.trim().length > 0);
    if (pasosValidos.length > 0) {
        md += `## Proceso Paso a Paso\n`;
        pasosValidos.forEach((paso, idx) => {
            md += `${idx + 1}. ${paso.trim()}\n`;
        });
        md += `\n`;
    }

    // 6. Reglas estrictas y restricciones
    const reglasValidas = appState.reglas.filter(r => r && r.trim().length > 0);
    if (reglasValidas.length > 0) {
        md += `## Reglas y Directrices Estrictas\n`;
        reglasValidas.forEach(regla => {
            md += `- ${regla.trim()}\n`;
        });
        md += `\n`;
    }

    // 7. Formato de Salida
    if (appState.salidas && appState.salidas.trim().length > 0) {
        md += `## Formato de Salida Esperado\n${appState.salidas.trim()}\n\n`;
    }

    // 8. Ejemplos prácticos (Few-shot prompting)
    const ejemplosValidos = appState.ejemplos.filter(e => (e.entrada && e.entrada.trim().length > 0) || (e.salida && e.salida.trim().length > 0));
    if (ejemplosValidos.length > 0) {
        md += `## Ejemplos de Referencia\n\n`;
        ejemplosValidos.forEach((ej, idx) => {
            md += `### Ejemplo ${idx + 1}\n\n`;
            if (ej.entrada && ej.entrada.trim().length > 0) {
                md += `**Entrada:**\n\`\`\`text\n${ej.entrada.trim()}\n\`\`\`\n\n`;
            }
            if (ej.salida && ej.salida.trim().length > 0) {
                md += `**Salida esperada:**\n\`\`\`markdown\n${ej.salida.trim()}\n\`\`\`\n\n`;
            }
        });
    }

    // 9. Casos límite y manejo de errores
    if (appState.casosLimite && appState.casosLimite.trim().length > 0) {
        md += `## Casos Límite y Manejo de Dudas\n${appState.casosLimite.trim()}\n\n`;
    }

    // 10. Recursos y archivos vinculados
    const archivosValidos = appState.archivosExtra.filter(f => f.nombre && f.nombre.trim().length > 0);
    if (archivosValidos.length > 0) {
        md += `## Archivos de Soporte y Recursos Bundled\n`;
        archivosValidos.forEach(file => {
            const ruta = `./${file.tipo}/${file.nombre.trim()}`;
            md += `- [${file.nombre.trim()}](${ruta})\n`;
        });
        md += `\n`;
    }

    return md;
}

// Evalúa las comprobaciones de calidad y calcula una puntuación porcentual
function evaluarCalidad() {
    let lista = [];

    // 1. Nombre sanitizado
    const nombreOriginal = appState.nombre || "";
    const nombreSanitizado = sanitizarNombreSkill(nombreOriginal);
    const esNombreValido = nombreOriginal.length >= 3 && nombreOriginal === nombreSanitizado;
    lista.push({
        label: "Nombre válido (minúsculas, números y guiones, sin espacios)",
        valido: esNombreValido,
        peso: 15
    });

    // 2. Descripción completa con triggers
    const desc = generarDescripcionGenerada();
    const tieneQueYCuando = desc.length >= 25 && desc.toLowerCase().includes("usar cuando");
    lista.push({
        label: "Descripción con 'qué hace' y condición 'cuándo usar' en 3ª persona",
        valido: tieneQueYCuando,
        peso: 20
    });

    // 3. Proceso paso a paso (mínimo 3 pasos)
    const pasosValidos = appState.pasos.filter(p => p && p.trim().length > 0);
    lista.push({
        label: "Flujo paso a paso detallado (mínimo 3 pasos definidos)",
        valido: pasosValidos.length >= 3,
        peso: 20
    });

    // 4. Reglas definidas (mínimo 2 reglas)
    const reglasValidas = appState.reglas.filter(r => r && r.trim().length > 0);
    lista.push({
        label: "Reglas y restricciones explícitas (mínimo 2 reglas)",
        valido: reglasValidas.length >= 2,
        peso: 15
    });

    // 5. Al menos un ejemplo concreto
    const ejemplosValidos = appState.ejemplos.filter(e => e.entrada && e.entrada.trim().length > 0 && e.salida && e.salida.trim().length > 0);
    lista.push({
        label: "Ejemplos prácticos de entrada y salida demostrada",
        valido: ejemplosValidos.length >= 1,
        peso: 15
    });

    // 6. Sin texto placeholder o marcas TODO
    const mdCompleto = construirMarkdownSkill();
    const tieneRelleno = mdCompleto.includes("[TODO]") || mdCompleto.includes("INSERTAR_") || mdCompleto.includes("XXX");
    lista.push({
        label: "Sin marcas de borrador o texto incompleto ([TODO], XXX)",
        valido: !tieneRelleno,
        peso: 10
    });

    // 7. Tamaño del documento razonable (< 500 líneas)
    const lineas = mdCompleto.split("\n").length;
    lista.push({
        label: `Tamaño del documento óptimo (${lineas} líneas, recomendado < 500)`,
        valido: lineas < 500,
        peso: 5
    });

    return lista;
}

// Calcula la puntuación total de calidad (0 a 100)
function calcularPuntuacionCalidad(checklist) {
    let puntosObtenidos = 0;
    let puntosTotales = 0;

    checklist.forEach(item => {
        puntosTotales += item.peso || 10;
        if (item.valido) {
            puntosObtenidos += item.peso || 10;
        }
    });

    return Math.round((puntosObtenidos / puntosTotales) * 100);
}

// Genera la representación en texto del árbol de carpetas
function generarArbolCarpetas() {
    const rootName = sanitizarNombreSkill(appState.nombre) || "mi-skill";
    let arbol = `${rootName}/
├── SKILL.md
`;

    let agrupados = {
        scripts: [],
        references: [],
        assets: []
    };

    appState.archivosExtra.forEach(file => {
        if (file.nombre && file.nombre.trim().length > 0 && agrupados[file.tipo]) {
            agrupados[file.tipo].push(file.nombre.trim());
        }
    });

    const tipos = ["scripts", "references", "assets"];
    tipos.forEach(tipoKey => {
        if (agrupados[tipoKey].length > 0) {
            arbol += `├── ${tipoKey}/
`;
            agrupados[tipoKey].forEach((archivo, idx) => {
                const esUltimo = idx === agrupados[tipoKey].length - 1;
                const prefijo = esUltimo ? "│   └── " : "│   ├── ";
                arbol += `${prefijo}${archivo}
`;
            });
        }
    });

    return arbol;
}

// Genera la guía paso a paso de cómo instalar y usar la skill
function generarGuiaInstalacion() {
    const nombreSkill = sanitizarNombreSkill(appState.nombre) || "mi-skill";

    return `### ¿Cómo usar esta Skill en tu entorno?

#### Opción 1: Claude Code o Asistentes con Skills Locales
1. Descarga el paquete descomprimido y colócalo en tu directorio de skills:
   - **Ruta global:** \`~/.claude/skills/${nombreSkill}/\`
   - **Ruta del proyecto:** \`.claude/skills/${nombreSkill}/\` o \`.gemini/skills/${nombreSkill}/\`
2. Asegúrate de que contenga el archivo principal: \`${nombreSkill}/SKILL.md\`.
3. Claude o el agente escaneará automáticamente la cabecera YAML y cargará la skill cuando tu mensaje coincida con la descripción.

#### Opción 2: Claude Projects (claude.ai)
1. Abre tu proyecto en **claude.ai**.
2. Ve a la sección **Project Knowledge** (Conocimiento del proyecto).
3. Sube el archivo \`SKILL.md\` generado.
4. En las **Instrucciones del Proyecto** (System Instructions), añade:
   > *"Sigue rigurosamente las pautas, pasos y directrices especificadas en el archivo SKILL.md adjunto al proyecto."*

#### Opción 3: Claude Desktop con MCP
Si empaquetas scripts o referencias, puedes vincular la carpeta como recurso en tu configuración de \`claude_desktop_config.json\`.`;
}
