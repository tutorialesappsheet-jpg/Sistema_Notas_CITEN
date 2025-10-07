/**
 * SISTEMA DE REPORTES ACADÉMICOS - CITEN
 * Archivo: Utils.gs
 * Descripción: Funciones auxiliares y utilidades generales del sistema
 * Incluye formateo, validaciones, conversiones y helpers
 */

// ============================================
// FUNCIONES DE FORMATEO DE FECHAS
// ============================================

/**
 * Formatea una fecha al formato DD/MM/YYYY
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
  if (!fecha) return '';
  
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  if (isNaN(date.getTime())) return '';
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  
  return `${dia}/${mes}/${anio}`;
}

/**
 * Formatea una fecha al formato largo (ej: "15 de Octubre de 2025")
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha en formato largo
 */
function formatearFechaLarga(fecha) {
  if (!fecha) return '';
  
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  if (isNaN(date.getTime())) return '';
  
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Obtiene el periodo académico actual basado en la fecha
 * @returns {string} Periodo actual (ej: "I Bimestre", "II Trimestre")
 */
function obtenerPeriodoActual() {
  const config = obtenerConfiguracion();
  
  if (config.periodo_actual) {
    return config.periodo_actual;
  }
  
  // Si no hay configuración, calcular basado en la fecha
  const fecha = new Date();
  const mes = fecha.getMonth() + 1; // 1-12
  
  // Sistema de bimestres (aprox)
  if (mes <= 4) return 'I Bimestre';
  if (mes <= 6) return 'II Bimestre';
  if (mes <= 9) return 'III Bimestre';
  return 'IV Bimestre';
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {Date} fecha1 - Primera fecha
 * @param {Date} fecha2 - Segunda fecha
 * @returns {number} Diferencia en días
 */
function calcularDiferenciaEnDias(fecha1, fecha2) {
  const unDia = 24 * 60 * 60 * 1000;
  const diferencia = Math.abs(fecha2 - fecha1);
  return Math.round(diferencia / unDia);
}

// ============================================
// FUNCIONES DE FORMATEO DE TEXTO
// ============================================

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} texto - Texto a formatear
 * @returns {string} Texto capitalizado
 */
function capitalizarTexto(texto) {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

/**
 * Convierte texto a formato de título (Title Case)
 * @param {string} texto - Texto a convertir
 * @returns {string} Texto en formato título
 */
function formatearTitulo(texto) {
  if (!texto) return '';
  
  const palabrasMinusculas = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'en', 'a'];
  
  return texto
    .toLowerCase()
    .split(' ')
    .map((palabra, index) => {
      // Primera palabra siempre con mayúscula
      if (index === 0 || !palabrasMinusculas.includes(palabra)) {
        return palabra.charAt(0).toUpperCase() + palabra.slice(1);
      }
      return palabra;
    })
    .join(' ');
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} texto - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado con "..."
 */
function truncarTexto(texto, maxLength = 50) {
  if (!texto || texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + '...';
}

/**
 * Limpia y normaliza texto (quita espacios extra, normaliza)
 * @param {string} texto - Texto a limpiar
 * @returns {string} Texto limpio
 */
function limpiarTexto(texto) {
  if (!texto) return '';
  return texto.trim().replace(/\s+/g, ' ');
}

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida si un email tiene formato correcto
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
function validarEmail(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida si un valor está vacío o es nulo
 * @param {*} valor - Valor a validar
 * @returns {boolean} true si está vacío
 */
function estaVacio(valor) {
  return valor === null || valor === undefined || valor === '' || 
         (Array.isArray(valor) && valor.length === 0);
}

/**
 * Valida si un número está en un rango específico
 * @param {number} numero - Número a validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {boolean} true si está en el rango
 */
function estaEnRango(numero, min, max) {
  const num = parseFloat(numero);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Valida datos de una calificación antes de registrar
 * @param {Object} datos - Datos a validar
 * @returns {Object} Resultado de la validación
 */
function validarDatosCalificacion(datos) {
  const errores = [];
  
  if (estaVacio(datos.idEstudiante)) {
    errores.push('ID de estudiante es requerido');
  }
  
  if (estaVacio(datos.area)) {
    errores.push('Área curricular es requerida');
  }
  
  if (estaVacio(datos.competencia)) {
    errores.push('Competencia es requerida');
  }
  
  if (estaVacio(datos.calificacionNum)) {
    errores.push('Calificación numérica es requerida');
  } else if (!estaEnRango(datos.calificacionNum, 0, 20)) {
    errores.push('La calificación debe estar entre 0 y 20');
  }
  
  return {
    valido: errores.length === 0,
    errores: errores
  };
}

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

/**
 * Convierte un array de objetos a CSV
 * @param {Array} datos - Array de objetos
 * @returns {string} Datos en formato CSV
 */
function arrayACSV(datos) {
  if (!datos || datos.length === 0) return '';
  
  // Obtener encabezados
  const headers = Object.keys(datos[0]);
  let csv = headers.join(',') + '\n';
  
  // Agregar datos
  datos.forEach(obj => {
    const valores = headers.map(header => {
      let valor = obj[header];
      // Escapar comas y comillas
      if (typeof valor === 'string') {
        valor = '"' + valor.replace(/"/g, '""') + '"';
      }
      return valor;
    });
    csv += valores.join(',') + '\n';
  });
  
  return csv;
}

/**
 * Convierte RGB a hexadecimal
 * @param {number} r - Rojo (0-255)
 * @param {number} g - Verde (0-255)
 * @param {number} b - Azul (0-255)
 * @returns {string} Color en formato hex
 */
function rgbAHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Convierte calificación numérica a porcentaje
 * @param {number} nota - Nota de 0-20
 * @returns {number} Porcentaje de 0-100
 */
function notaAPorcentaje(nota) {
  return (parseFloat(nota) / 20 * 100).toFixed(1);
}

// ============================================
// FUNCIONES DE GENERACIÓN DE IDs
// ============================================

/**
 * Genera un ID único basado en timestamp
 * @returns {string} ID único
 */
function generarIdUnico() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Genera un ID de estudiante formateado
 * @param {string} grado - Grado del estudiante
 * @param {string} seccion - Sección del estudiante
 * @param {number} numero - Número correlativo
 * @returns {string} ID formateado (ej: "5A-001")
 */
function generarIdEstudiante(grado, seccion, numero) {
  const numeroFormateado = String(numero).padStart(3, '0');
  return `${grado}${seccion}-${numeroFormateado}`;
}

// ============================================
// FUNCIONES DE ARRAYS Y OBJETOS
// ============================================

/**
 * Agrupa un array de objetos por una propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} propiedad - Propiedad por la cual agrupar
 * @returns {Object} Objeto con los grupos
 */
function agruparPor(array, propiedad) {
  return array.reduce((grupos, item) => {
    const clave = item[propiedad];
    if (!grupos[clave]) {
      grupos[clave] = [];
    }
    grupos[clave].push(item);
    return grupos;
  }, {});
}

/**
 * Ordena un array de objetos por una propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} propiedad - Propiedad para ordenar
 * @param {boolean} ascendente - true para ascendente, false para descendente
 * @returns {Array} Array ordenado
 */
function ordenarPor(array, propiedad, ascendente = true) {
  return array.sort((a, b) => {
    const valorA = a[propiedad];
    const valorB = b[propiedad];
    
    if (valorA < valorB) return ascendente ? -1 : 1;
    if (valorA > valorB) return ascendente ? 1 : -1;
    return 0;
  });
}

/**
 * Elimina duplicados de un array
 * @param {Array} array - Array con posibles duplicados
 * @returns {Array} Array sin duplicados
 */
function eliminarDuplicados(array) {
  return [...new Set(array)];
}

/**
 * Filtra objetos que coincidan con criterios múltiples
 * @param {Array} array - Array de objetos
 * @param {Object} criterios - Objeto con criterios de filtrado
 * @returns {Array} Array filtrado
 */
function filtrarMultiple(array, criterios) {
  return array.filter(item => {
    return Object.keys(criterios).every(key => {
      return item[key] === criterios[key];
    });
  });
}

// ============================================
// FUNCIONES DE ESTADÍSTICAS SIMPLES
// ============================================

/**
 * Calcula la media de un array de números
 * @param {Array} numeros - Array de números
 * @returns {number} Media
 */
function calcularMedia(numeros) {
  if (!numeros || numeros.length === 0) return 0;
  const suma = numeros.reduce((acc, num) => acc + parseFloat(num), 0);
  return suma / numeros.length;
}

/**
 * Calcula la mediana de un array de números
 * @param {Array} numeros - Array de números
 * @returns {number} Mediana
 */
function calcularMediana(numeros) {
  if (!numeros || numeros.length === 0) return 0;
  
  const sorted = numeros.slice().sort((a, b) => a - b);
  const medio = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[medio - 1] + sorted[medio]) / 2;
  }
  
  return sorted[medio];
}

/**
 * Encuentra el valor más frecuente (moda)
 * @param {Array} array - Array de valores
 * @returns {*} Valor más frecuente
 */
function calcularModa(array) {
  if (!array || array.length === 0) return null;
  
  const frecuencias = {};
  let maxFrecuencia = 0;
  let moda = array[0];
  
  array.forEach(valor => {
    frecuencias[valor] = (frecuencias[valor] || 0) + 1;
    if (frecuencias[valor] > maxFrecuencia) {
      maxFrecuencia = frecuencias[valor];
      moda = valor;
    }
  });
  
  return moda;
}

/**
 * Calcula la desviación estándar
 * @param {Array} numeros - Array de números
 * @returns {number} Desviación estándar
 */
function calcularDesviacionEstandar(numeros) {
  if (!numeros || numeros.length === 0) return 0;
  
  const media = calcularMedia(numeros);
  const varianza = numeros.reduce((acc, num) => {
    return acc + Math.pow(parseFloat(num) - media, 2);
  }, 0) / numeros.length;
  
  return Math.sqrt(varianza);
}

// ============================================
// FUNCIONES DE LOGGING Y DEBUG
// ============================================

/**
 * Registra un evento en una hoja de logs
 * @param {string} tipo - Tipo de evento (INFO, ERROR, WARNING)
 * @param {string} mensaje - Mensaje del log
 * @param {Object} datos - Datos adicionales (opcional)
 */
function registrarLog(tipo, mensaje, datos = null) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Logs');
    
    // Crear hoja de logs si no existe
    if (!sheet) {
      sheet = ss.insertSheet('Logs');
      sheet.appendRow(['Fecha/Hora', 'Tipo', 'Mensaje', 'Datos', 'Usuario']);
    }
    
    const usuario = Session.getActiveUser().getEmail();
    const timestamp = new Date();
    const datosStr = datos ? JSON.stringify(datos) : '';
    
    sheet.appendRow([timestamp, tipo, mensaje, datosStr, usuario]);
    
  } catch (error) {
    Logger.log('Error al registrar log: ' + error.toString());
  }
}

/**
 * Registra un evento de auditoría (cambios importantes)
 * @param {string} accion - Acción realizada
 * @param {Object} detalles - Detalles de la acción
 */
function registrarAuditoria(accion, detalles) {
  registrarLog('AUDIT', accion, detalles);
}

// ============================================
// FUNCIONES DE CACHÉ Y RENDIMIENTO
// ============================================

/**
 * Guarda un valor en caché con tiempo de expiración
 * @param {string} clave - Clave del caché
 * @param {*} valor - Valor a guardar
 * @param {number} segundos - Tiempo de expiración en segundos
 */
function guardarEnCache(clave, valor, segundos = 600) {
  const cache = CacheService.getScriptCache();
  cache.put(clave, JSON.stringify(valor), segundos);
}

/**
 * Obtiene un valor del caché
 * @param {string} clave - Clave del caché
 * @returns {*} Valor guardado o null si no existe
 */
function obtenerDeCache(clave) {
  const cache = CacheService.getScriptCache();
  const valor = cache.get(clave);
  return valor ? JSON.parse(valor) : null;
}

/**
 * Limpia el caché completo
 */
function limpiarCache() {
  const cache = CacheService.getScriptCache();
  cache.removeAll();
}

// ============================================
// FUNCIONES DE COLORES Y UI
// ============================================

/**
 * Obtiene el color según el nivel de logro
 * @param {string} nivel - Nivel de logro (AD/A/B/C)
 * @returns {string} Color en hexadecimal
 */
function obtenerColorPorNivel(nivel) {
  const colores = {
    'AD': '#10b981', // Verde
    'A': '#3b82f6',  // Azul
    'B': '#f59e0b',  // Amarillo/Naranja
    'C': '#ef4444'   // Rojo
  };
  return colores[nivel] || '#6b7280'; // Gris por defecto
}

/**
 * Genera un color más claro (para backgrounds)
 * @param {string} hex - Color en hexadecimal
 * @param {number} porcentaje - Porcentaje a aclarar (0-100)
 * @returns {string} Color aclarado
 */
function aclararColor(hex, porcentaje) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const factor = porcentaje / 100;
  const nr = Math.min(255, r + (255 - r) * factor);
  const ng = Math.min(255, g + (255 - g) * factor);
  const nb = Math.min(255, b + (255 - b) * factor);
  
  return rgbAHex(Math.round(nr), Math.round(ng), Math.round(nb));
}

// ============================================
// FUNCIONES DE NOTIFICACIONES MEJORADAS
// ============================================

/**
 * Envía un email con formato HTML mejorado
 * @param {string} destinatario - Email del destinatario
 * @param {string} asunto - Asunto del email
 * @param {string} contenido - Contenido HTML
 * @returns {boolean} true si se envió correctamente
 */
function enviarEmailHTML(destinatario, asunto, contenido) {
  try {
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Sistema de Reportes Académicos - CITEN</h2>
        </div>
        <div class="content">
          ${contenido}
        </div>
        <div class="footer">
          <p>Este es un mensaje automático. Por favor no responder.</p>
          <p>© 2025 CITEN - Centro de Investigación Técnica</p>
        </div>
      </body>
      </html>
    `;
    
    MailApp.sendEmail({
      to: destinatario,
      subject: asunto,
      htmlBody: htmlBody
    });
    
    registrarLog('INFO', 'Email enviado', { destinatario: destinatario, asunto: asunto });
    return true;
    
  } catch (error) {
    registrarLog('ERROR', 'Error al enviar email', { error: error.toString() });
    return false;
  }
}

// ============================================
// FUNCIONES DE EXPORTACIÓN Y DESCARGA
// ============================================

/**
 * Crea un archivo temporal y devuelve su URL
 * @param {string} contenido - Contenido del archivo
 * @param {string} nombreArchivo - Nombre del archivo
 * @param {string} mimeType - Tipo MIME
 * @returns {string} URL del archivo
 */
function crearArchivoTemporal(contenido, nombreArchivo, mimeType) {
  const blob = Utilities.newBlob(contenido, mimeType, nombreArchivo);
  const archivo = DriveApp.createFile(blob);
  
  // Hacer el archivo accesible públicamente (temporal)
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return archivo.getUrl();
}

// ============================================
// FUNCIÓN DE TEST
// ============================================

/**
 * Función de prueba para verificar utilidades
 */
function testUtils() {
  Logger.log('=== TEST UTILS.GS ===');
  
  Logger.log('\n1. Formateo de fechas:');
  const hoy = new Date();
  Logger.log('Fecha corta: ' + formatearFecha(hoy));
  Logger.log('Fecha larga: ' + formatearFechaLarga(hoy));
  Logger.log('Periodo actual: ' + obtenerPeriodoActual());
  
  Logger.log('\n2. Formateo de texto:');
  Logger.log(capitalizarTexto('juan garcía lópez'));
  Logger.log(formatearTitulo('resuelve problemas de cantidad'));
  
  Logger.log('\n3. Validaciones:');
  Logger.log('Email válido: ' + validarEmail('test@citen.edu.pe'));
  Logger.log('Calificación en rango: ' + estaEnRango(15, 0, 20));
  
  Logger.log('\n4. Estadísticas:');
  const notas = [15, 16, 14, 18, 17];
  Logger.log('Media: ' + calcularMedia(notas));
  Logger.log('Mediana: ' + calcularMediana(notas));
  Logger.log('Desviación: ' + calcularDesviacionEstandar(notas).toFixed(2));
  
  Logger.log('\n5. Colores:');
  Logger.log('Color AD: ' + obtenerColorPorNivel('AD'));
  Logger.log('Color aclarado: ' + aclararColor('#10b981', 50));
  
  Logger.log('\n✅ Test de Utils completado');
}
