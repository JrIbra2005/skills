// Estado global de la aplicación y almacenamiento local (localStorage)

const STORAGE_KEY = "claude_skill_builder_draft_v2";

let currentLang = "es";
let currentStep = 1;
let livePreviewActivo = false;
let tabResultadoActivo = "preview"; // 'preview' | 'structure' | 'install'

// Estructura inicial del estado del borrador
let appState = {
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
    archivosExtra: [] // { tipo: 'scripts'|'references'|'assets', nombre: '', contenido: '' }
};

// Plantillas prediseñadas (Presets)
const PRESETS = {
    meeting: {
        ideaInicial: "Quiero que Claude redacte actas de reunión profesionales con acuerdos, tareas y responsables.",
        nombre: "redactor-actas-reunion",
        queHace: "Genera actas de reunión profesionales y ejecutivas estructurando acuerdos, compromisos y tareas a partir de notas o transcripciones.",
        cuandoActivar: "Cuando el usuario pida redactar o resumir una reunión, videollamada, standup o proporcione notas de una sesión de trabajo.",
        cuandoNoActivar: "No usar para redactar correos casuales de felicitación o documentos que no provengan de una reunión de equipo.",
        entradas: "Transcripción sin procesar, notas rápidas, lista opcional de asistentes y fecha.",
        salidas: "Documento Markdown estructurado con: Resumen Ejecutivo, Puntos Tratados, Tabla de Acuerdos y Tareas Pendientes (con Responsable y Fecha).",
        pasos: [
            "Analizar la transcripción identificando participantes, temas clave y contexto.",
            "Sintetizar los puntos de discusión descartando conversaciones triviales.",
            "Extraer todos los compromisos expresos y redactar la tabla de tareas con responsables claros."
        ],
        reglas: [
            "Mantener un tono ejecutivo, neutral y conciso.",
            "Bajo ninguna circunstancia inventar compromisos o fechas que no figuren en la transcripción.",
            "Si un responsable no está explícito, marcarlo como [Por definir]."
        ],
        ejemplos: [
            {
                entrada: "Notas: Reunión de diseño de producto. Andrea entregará wireframes el próximo martes. Tomás aprobará el presupuesto el jueves.",
                salida: "## Acta de Sesión: Diseño de Producto\n\n### Resumen Ejecutivo\nSe definieron los plazos de entrega de diseño y la validación financiera.\n\n### Tabla de Tareas\n| Tarea | Responsable | Fecha Límite |\n|---|---|---|\n| Entrega de wireframes | Andrea | Próximo martes |\n| Aprobación de presupuesto | Tomás | Próximo jueves |"
            }
        ],
        casosLimite: "Si el audio está cortado o hay frases inaudibles, señalar [Aclaración pendiente con el equipo] en lugar de asumir lo dicho.",
        archivosExtra: [
            {
                tipo: "references",
                nombre: "plantilla-acta-corporativa.md",
                contenido: "# Formato Estándar de Actas\n## 1. Asistentes\n## 2. Agenda\n## 3. Resoluciones\n## 4. Próxima Convocatoria"
            }
        ]
    },
    code: {
        ideaInicial: "Quiero que Claude revise código, detecte vulnerabilidades de seguridad y proponga refactorizaciones limpias.",
        nombre: "auditor-codigo-seguridad",
        queHace: "Audita fragmentos de código o repositorios detectando problemas de seguridad OWASP, fallos de rendimiento y violaciones de Clean Code.",
        cuandoActivar: "Cuando el usuario solicite un code review, auditar seguridad, optimizar rendimiento o mejorar la calidad de un archivo de código.",
        cuandoNoActivar: "No usar para generar código nuevo desde cero sin contexto de auditoría o para redacción no técnica.",
        entradas: "Archivos fuente o snippets de código en cualquier lenguaje moderno (JS, TS, Python, Go, Rust, Java, etc.).",
        salidas: "Informe en Markdown con: Nivel de Gravedad (Crítico/Medio/Bajo), Explicación del Problema, Código Vulnerable vs Código Corregido y Test sugerido.",
        pasos: [
            "Inspeccionar el código buscando inyecciones (SQL, XSS, Command Injection) y fugas de memoria.",
            "Evaluar el cumplimiento de principios SOLID y legibilidad (Clean Code).",
            "Proporcionar una versión corregida lista para copiar, explicando cada modificación."
        ],
        reglas: [
            "Priorizar siempre la seguridad sobre la brevedad.",
            "Explicar con exactitud por qué la versión anterior era vulnerable.",
            "Proporcionar código corregido sin omitir partes críticas con comentarios vagos como '// resto del código'."
        ],
        ejemplos: [
            {
                entrada: "const query = 'SELECT * FROM users WHERE id = ' + req.params.id;\ndb.execute(query);",
                salida: "### Hallazgo de Seguridad: Inyección SQL (Crítico)\n**Problema:** Se concatena directamente la entrada del usuario en la sentencia SQL.\n\n**Solución:** Utilizar sentencias preparadas con parámetros:\n```javascript\nconst query = 'SELECT * FROM users WHERE id = ?';\ndb.execute(query, [req.params.id]);\n```"
            }
        ],
        casosLimite: "Si falta contexto sobre dependencias o frameworks utilizados, documentar las suposiciones explícitamente antes del análisis.",
        archivosExtra: [
            {
                tipo: "references",
                nombre: "guia-owasp-top10.md",
                contenido: "# Checklist OWASP Top 10\n1. Inyección\n2. Fallas criptográficas\n3. Configuración incorrecta de seguridad"
            }
        ]
    },
    seo: {
        ideaInicial: "Quiero que Claude redacte artículos divulgativos y optimizados para SEO basados en investigaciones o novedades.",
        nombre: "redactor-contenido-seo",
        queHace: "Crea artículos editoriales y publicaciones optimizadas para buscadores siguiendo buenas prácticas de estructura H1/H2/H3 y semántica.",
        cuandoActivar: "Cuando el usuario pida redactar un artículo de blog, post informativo, guía o contenido para posicionar en Google.",
        cuandoNoActivar: "No usar para documentación técnica interna de APIs o mensajes breves en redes sociales.",
        entradas: "Tema central, palabra clave principal, palabras clave secundarias y audiencia objetivo.",
        salidas: "Artículo en Markdown con meta-título, meta-descripción, encabezados estructurados, llamadas a la acción y preguntas frecuentes (FAQ).",
        pasos: [
            "Analizar la intención de búsqueda del usuario y planificar la estructura jerárquica.",
            "Redactar una introducción atractiva que enganche al lector en los primeros 3 segundos.",
            "Desarrollar el cuerpo con explicaciones claras, ejemplos y sección de preguntas frecuentes."
        ],
        reglas: [
            "Evitar el relleno ('fluff') y frases cliché como 'en la era digital actual'.",
            "Integrar las palabras clave de forma natural sin sobreoptimización (keyword stuffing)."
        ],
        ejemplos: [
            {
                entrada: "Tema: Cómo aprender TypeScript en 2026. Keyword: aprender typescript.",
                salida: "# Cómo Aprender TypeScript: Guía Práctica de Cero a Producción\n\n**Meta-descripción:** Domina TypeScript con esta ruta paso a paso...\n\n## 1. Por qué TypeScript se ha vuelto indispensable..."
            }
        ],
        casosLimite: "Si el tema es excesivamente amplio, sugerir enfocar el artículo en un subtema más concreto para maximizar la calidad.",
        archivosExtra: []
    },
    data: {
        ideaInicial: "Quiero que Claude extraiga y limpie datos no estructurados de facturas, recibos o tablas y los convierta a JSON.",
        nombre: "extractor-datos-json",
        queHace: "Analiza texto desestructurado, tablas o recibos y extrae la información en un formato JSON estricto y tipado.",
        cuandoActivar: "Cuando el usuario proporcione texto desordenado, tickets, recibos o listas y necesite un JSON limpio y validado.",
        cuandoNoActivar: "No usar para resúmenes descriptivos en prosa.",
        entradas: "Texto de la factura, transcripción de recibo o datos en bruto.",
        salidas: "Única y exclusivamente un bloque de código JSON válido y formateado, sin explicaciones adicionales fuera del bloque.",
        pasos: [
            "Identificar las entidades clave (emisor, fecha, importe total, desglose de impuestos, líneas de factura).",
            "Normalizar formatos de fecha a ISO 8601 (AAAA-MM-DD) y números a flotantes con punto decimal.",
            "Validar la integridad del JSON antes de emitirlo."
        ],
        reglas: [
            "No incluir texto explicativo antes ni después del JSON.",
            "Garantizar que todos los campos requeridos estén presentes o con valor null si no existen."
        ],
        ejemplos: [
            {
                entrada: "Factura de Supermercado Sol. Fecha: 12 de Mayo 2026. Pan: 1.50€, Leche: 1.20€. Total: 2.70€ con 10% IVA.",
                salida: "```json\n{\n  \"emisor\": \"Supermercado Sol\",\n  \"fecha\": \"2026-05-12\",\n  \"total\": 2.70,\n  \"moneda\": \"EUR\",\n  \"items\": [\n    {\"descripcion\": \"Pan\", \"precio\": 1.50},\n    {\"descripcion\": \"Leche\", \"precio\": 1.20}\n  ]\n}\n```"
            }
        ],
        casosLimite: "Si una cifra es ambigua o ilegible, asignar null y añadir una propiedad _advertencias con la descripción de la duda.",
        archivosExtra: [
            {
                tipo: "references",
                nombre: "schema-facturas.json",
                contenido: "{\n  \"$schema\": \"http://json-schema.org/draft-07/schema#\",\n  \"type\": \"object\",\n  \"required\": [\"emisor\", \"fecha\", \"total\"]\n}"
            }
        ]
    }
};

// Carga el borrador guardado localmente
function cargarBorradorGuardado() {
    let borradorCargado = null;
    try {
        const datosGuardados = localStorage.getItem(STORAGE_KEY);
        if (datosGuardados) {
            borradorCargado = JSON.parse(datosGuardados);
        }
    } catch (e) {
        console.error("Error al cargar localStorage:", e);
        borradorCargado = null;
    }

    if (borradorCargado !== null) {
        appState = Object.assign({}, appState, borradorCargado);
    }
    return borradorCargado;
}

// Guarda el estado actual en localStorage
function guardarBorradorLocal() {
    let exito = false;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        exito = true;
    } catch (e) {
        console.error("Error al guardar en localStorage:", e);
        exito = false;
    }
    return exito;
}

// Limpia el borrador almacenado
function limpiarBorradorLocal() {
    let res = false;
    try {
        localStorage.removeItem(STORAGE_KEY);
        res = true;
    } catch (e) {
        console.error("Error al limpiar localStorage:", e);
        res = false;
    }
    return res;
}
