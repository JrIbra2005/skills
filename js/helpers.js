// Funciones auxiliares de formateo y manipulaciones de texto

// Formatea un texto a slug (minusculas, numeros y guiones, max 64 caracteres)
function sanitizarNombreSkill(texto) {
    let resultado = "";
    if (texto !== null && texto !== undefined) {
        resultado = texto.toString()
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
            .replace(/[^a-z0-9\s-]/g, "") // Remueve caracteres especiales
            .replace(/[\s_]+/g, "-") // Espacios a guiones
            .replace(/-+/g, "-") // Remueve guiones dobles
            .substring(0, 64);
    }
    return resultado;
}

// Escapa código HTML para renderizado seguro
function escaparHtml(cadena) {
    let textoEscapado = "";
    if (cadena !== null && cadena !== undefined) {
        textoEscapado = cadena.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    return textoEscapado;
}

// Notificación Toast elegante
function mostrarToast(mensaje, icono = "check") {
    let contenedor = document.getElementById("toast-container");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "toast-container";
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <i data-lucide="${icono}" class="w-4 h-4 text-[#D97757]"></i>
        <span>${escaparHtml(mensaje)}</span>
    `;
    contenedor.appendChild(toast);
    lucide.createIcons({ root: toast });

    setTimeout(() => {
        toast.classList.add("toast-leave");
        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

// Copia un texto al portapapeles con fallback robusto
async function copiarAlPortapapeles(texto) {
    let exito = false;
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
            exito = true;
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = texto;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            exito = document.execCommand("copy");
            textArea.remove();
        }
    } catch (err) {
        console.error("Error al copiar:", err);
        exito = false;
    }
    return exito;
}

// Descarga directa de archivo de texto
function descargarArchivoTexto(nombreArchivo, contenido) {
    const blob = new Blob([contenido], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
