/**
 * SISTEMA DE REPORTES ACADÉMICOS - CITEN
 * Archivo: Code.gs
 * Descripción: Funciones principales y configuración de la Web App
 * Versión: 1.0 - Compatible con Gmail normal
 */

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================

// ⚠️ IMPORTANTE: Reemplaza este ID con el ID de tu Google Sheets
// El ID está en la URL: https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
const SPREADSHEET_ID = '1QFt6BFYtc8V_EIXqYROKo-aiqlDiRiBCTtb6IcbFERw';

// Nombres de las pestañas en tu hoja de cálculo
const SHEETS = {
  CALIFICACIONES: 'BD_Calificaciones',
  ESTUDIANTES: 'Estudiantes',
  COMPETENCIAS: 'Competencias',
  CONFIG: 'Config'
};

// ============================================
// FUNCIÓN PRINCIPAL - WEB APP
// ============================================

/**
 * Función que se ejecuta cuando alguien accede a la Web App
 * Maneja la autenticación y carga la interfaz correspondiente
 */
function doGet(e) {
  // Obtener el email del usuario actual
  const userEmail = Session.getActiveUser().getEmail();
  
  // Si no hay email (no autenticado), mostrar página de login
  if (!userEmail) {
    return HtmlService.createHtmlOutputFromFile('Login')
      .setTitle('Sistema de Notas - CITEN')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Verificar si el usuario existe en la base de datos
  const usuario = obtenerUsuarioPorEmail(userEmail);
  
  if (!usuario) {
    // Usuario no registrado
    return HtmlService.createHtmlOutput(`
      <html>
        <head>
          <base target="_top">
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #667eea; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .email { 
              background: #f0f0f0; 
              padding: 10px; 
              border-radius: 5px; 
              margin: 20px 0;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Usuario No Registrado</h1>
            <p>El correo electrónico:</p>
            <div class="email">${userEmail}</div>
            <p>No está registrado en el sistema.</p>
            <p>Por favor, contacta al administrador para que agregue tu correo a la lista de estudiantes o docentes.</p>
          </div>
        </body>
      </html>
    `)
    .setTitle('Usuario No Registrado')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Determinar el rol del usuario
  const rol = determinarRol(usuario);
  
  // Cargar la interfaz correspondiente según el rol
  let template;
  
  if (rol === 'estudiante') {
    template = HtmlService.createTemplateFromFile('Estudiante');
    template.usuario = usuario;
    template.email = userEmail;
  } else if (rol === 'docente') {
    template = HtmlService.createTemplateFromFile('Docente');
    template.usuario = usuario;
    template.email = userEmail;
  } else {
    // Admin o sin rol definido, mostrar dashboard de estudiante por defecto
    template = HtmlService.createTemplateFromFile('Estudiante');
    template.usuario = usuario;
    template.email = userEmail;
  }
  
  return template.evaluate()
    .setTitle('Sistema de Notas - CITEN')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ============================================
// FUNCIÓN PARA INCLUIR ARCHIVOS HTML
// ============================================

/**
 * Incluye contenido de otros archivos HTML (para CSS y JS)
 * Uso en HTML: <?!= include('Stylesheet'); ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN Y USUARIOS
// ============================================

/**
 * Obtiene datos del usuario actual autenticado
 * @returns {Object} Objeto con datos del usuario y sus calificaciones
 */
function obtenerDatosUsuarioActual() {
  const userEmail = Session.getActiveUser().getEmail();
  const usuario = obtenerUsuarioPorEmail(userEmail);
  
  if (!usuario) {
    return { error: 'Usuario no encontrado' };
  }
  
  const rol = determinarRol(usuario);
  const calificaciones = obtenerCalificacionesPorEstudiante(userEmail);
  const promedios = calcularPromedios(calificaciones);
  const estadisticas = calcularEstadisticas(calificaciones);
  
  return {
    usuario: usuario,
    rol: rol,
    calificaciones: calificaciones,
    promedios: promedios,
    estadisticas: estadisticas
  };
}

/**
 * Busca un usuario por su email en la pestaña Estudiantes
 * @param {string} email - Email del usuario
 * @returns {Object|null} Datos del usuario o null si no existe
 */
function obtenerUsuarioPorEmail(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.ESTUDIANTES);
  const data = sheet.getDataRange().getValues();
  
  // Saltar la primera fila (encabezados)
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] && data[i][3].toLowerCase() === email.toLowerCase()) {
      return {
        id: data[i][0],
        apellidos: data[i][1],
        nombres: data[i][2],
        correo: data[i][3],
        grado: data[i][4],
        seccion: data[i][5],
        fotoUrl: data[i][6] || 'https://via.placeholder.com/150'
      };
    }
  }
  
  return null;
}

/**
 * Determina el rol del usuario (estudiante/docente/admin)
 * Por ahora todos son estudiantes, pero puedes agregar lógica
 */
function determinarRol(usuario) {
  // Aquí puedes agregar lógica más compleja
  // Por ejemplo, verificar si el email está en una lista de docentes
  
  // Por ahora, todos son estudiantes
  return 'estudiante';
  
  // Ejemplo de lógica futura:
  // if (usuario.correo.includes('docente') || usuario.correo.includes('profesor')) {
  //   return 'docente';
  // }
  // return 'estudiante';
}

// ============================================
// FUNCIONES DE DATOS - CALIFICACIONES
// ============================================

/**
 * Obtiene todas las calificaciones de un estudiante
 * @param {string} email - Email del estudiante
 * @returns {Array} Array de objetos con las calificaciones
 */
function obtenerCalificacionesPorEstudiante(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
  const data = sheet.getDataRange().getValues();
  
  const calificaciones = [];
  
  // Saltar encabezados (fila 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Columna 3 es el correo (índice 3)
    if (row[3] && row[3].toLowerCase() === email.toLowerCase()) {
      calificaciones.push({
        id: row[0],
        apellidos: row[1],
        nombres: row[2],
        correo: row[3],
        grado: row[4],
        seccion: row[5],
        area: row[6],
        competencia: row[7],
        calificacion: row[8],
        calificacionNum: row[9],
        periodo: row[10],
        fecha: row[11],
        retroalimentacion: row[12] || ''
      });
    }
  }
  
  return calificaciones;
}

/**
 * Obtiene todas las calificaciones (para docentes/admin)
 * @returns {Array} Array con todas las calificaciones
 */
function obtenerTodasCalificaciones() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
  const data = sheet.getDataRange().getValues();
  
  const calificaciones = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    calificaciones.push({
      id: row[0],
      apellidos: row[1],
      nombres: row[2],
      correo: row[3],
      grado: row[4],
      seccion: row[5],
      area: row[6],
      competencia: row[7],
      calificacion: row[8],
      calificacionNum: row[9],
      periodo: row[10],
      fecha: row[11],
      retroalimentacion: row[12] || ''
    });
  }
  
  return calificaciones;
}

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Calcula promedios por área y competencia
 * @param {Array} calificaciones - Array de calificaciones
 * @returns {Object} Objeto con promedios calculados
 */
function calcularPromedios(calificaciones) {
  const promedios = {
    general: 0,
    porArea: {},
    porCompetencia: {}
  };
  
  let sumaTotal = 0;
  let contadorTotal = 0;
  
  // Agrupar por área
  calificaciones.forEach(cal => {
    const area = cal.area;
    const competencia = cal.competencia;
    const nota = parseFloat(cal.calificacionNum) || 0;
    
    // Promedio por área
    if (!promedios.porArea[area]) {
      promedios.porArea[area] = { suma: 0, contador: 0, promedio: 0 };
    }
    promedios.porArea[area].suma += nota;
    promedios.porArea[area].contador += 1;
    
    // Promedio por competencia
    const key = `${area} - ${competencia}`;
    if (!promedios.porCompetencia[key]) {
      promedios.porCompetencia[key] = { suma: 0, contador: 0, promedio: 0, area: area };
    }
    promedios.porCompetencia[key].suma += nota;
    promedios.porCompetencia[key].contador += 1;
    
    sumaTotal += nota;
    contadorTotal += 1;
  });
  
  // Calcular promedios finales
  promedios.general = contadorTotal > 0 ? (sumaTotal / contadorTotal).toFixed(2) : 0;
  
  for (let area in promedios.porArea) {
    const data = promedios.porArea[area];
    promedios.porArea[area].promedio = (data.suma / data.contador).toFixed(2);
  }
  
  for (let comp in promedios.porCompetencia) {
    const data = promedios.porCompetencia[comp];
    promedios.porCompetencia[comp].promedio = (data.suma / data.contador).toFixed(2);
  }
  
  return promedios;
}

/**
 * Calcula estadísticas generales del estudiante
 * @param {Array} calificaciones - Array de calificaciones
 * @returns {Object} Estadísticas calculadas
 */
function calcularEstadisticas(calificaciones) {
  let totalAD = 0, totalA = 0, totalB = 0, totalC = 0;
  
  calificaciones.forEach(cal => {
    switch(cal.calificacion) {
      case 'AD': totalAD++; break;
      case 'A': totalA++; break;
      case 'B': totalB++; break;
      case 'C': totalC++; break;
    }
  });
  
  return {
    total: calificaciones.length,
    porNivel: {
      AD: totalAD,
      A: totalA,
      B: totalB,
      C: totalC
    },
    porcentajes: {
      AD: calificaciones.length > 0 ? ((totalAD / calificaciones.length) * 100).toFixed(1) : 0,
      A: calificaciones.length > 0 ? ((totalA / calificaciones.length) * 100).toFixed(1) : 0,
      B: calificaciones.length > 0 ? ((totalB / calificaciones.length) * 100).toFixed(1) : 0,
      C: calificaciones.length > 0 ? ((totalC / calificaciones.length) * 100).toFixed(1) : 0
    }
  };
}

/**
 * Convierte calificación numérica a literal (AD/A/B/C)
 * @param {number} nota - Calificación numérica (0-20)
 * @returns {string} Calificación literal
 */
function convertirNotaALiteral(nota) {
  nota = parseFloat(nota);
  if (nota >= 18) return 'AD';
  if (nota >= 14) return 'A';
  if (nota >= 11) return 'B';
  return 'C';
}

// ============================================
// FUNCIONES DE REGISTROS (PARA DOCENTES)
// ============================================

/**
 * Registra una nueva calificación
 * @param {Object} datos - Objeto con los datos de la calificación
 * @returns {Object} Resultado de la operación
 */
function registrarCalificacion(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
    
    // Convertir nota numérica a literal si no viene
    const notaLiteral = datos.calificacion || convertirNotaALiteral(datos.calificacionNum);
    
    // Agregar nueva fila
    sheet.appendRow([
      datos.idEstudiante,
      datos.apellidos,
      datos.nombres,
      datos.correo,
      datos.grado,
      datos.seccion,
      datos.area,
      datos.competencia,
      notaLiteral,
      datos.calificacionNum,
      datos.periodo,
      datos.fecha || new Date(),
      datos.retroalimentacion || ''
    ]);
    
    return { success: true, mensaje: 'Calificación registrada correctamente' };
  } catch (error) {
    return { success: false, mensaje: 'Error al registrar: ' + error.toString() };
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtiene la configuración del sistema
 * @returns {Object} Configuración actual
 */
function obtenerConfiguracion() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  const data = sheet.getDataRange().getValues();
  
  const config = {};
  
  for (let i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }
  
  return config;
}

/**
 * Test de conexión a la hoja de cálculo
 * Ejecuta esto desde el editor para verificar que todo funciona
 */
function testConexion() {
  Logger.log('Probando conexión...');
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('Hoja de cálculo conectada: ' + ss.getName());
  
  const estudiantes = ss.getSheetByName(SHEETS.ESTUDIANTES);
  Logger.log('Total de estudiantes: ' + (estudiantes.getLastRow() - 1));
  
  const calificaciones = ss.getSheetByName(SHEETS.CALIFICACIONES);
  Logger.log('Total de calificaciones: ' + (calificaciones.getLastRow() - 1));
  
  Logger.log('✅ Conexión exitosa');
}

/**
 * Función para crear menú personalizado en Google Sheets
 * Se ejecuta automáticamente al abrir la hoja
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Sistema de Notas')
    .addItem('🚀 Abrir Web App', 'abrirWebApp')
    .addItem('🔧 Test de Conexión', 'testConexion')
    .addSeparator()
    .addItem('📖 Ayuda', 'mostrarAyuda')
    .addToUi();
}

/**
 * Abre la Web App en una nueva ventana
 */
function abrirWebApp() {
  const url = ScriptApp.getService().getUrl();
  const html = '<html><script>window.open("' + url + '");google.script.host.close();</script></html>';
  const ui = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(ui, 'Abriendo Web App...');
}

/**
 * Muestra ayuda básica
 */
function mostrarAyuda() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Sistema de Reportes Académicos - CITEN',
    '1. Asegúrate de tener datos en las pestañas: Estudiantes, Competencias y BD_Calificaciones\n\n' +
    '2. Ve a Implementar > Nueva implementación > Aplicación web\n\n' +
    '3. Configura: Ejecutar como "Yo" y Acceso "Cualquier usuario"\n\n' +
    '4. Copia la URL y compártela con los estudiantes\n\n' +
    '5. Cada usuario verá solo sus propias calificaciones',
    ui.ButtonSet.OK
  );
}
