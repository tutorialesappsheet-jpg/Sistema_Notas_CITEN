/**
 * SISTEMA DE REPORTES ACADÉMICOS - CITEN
 * Archivo: Code.gs - VERSIÓN FINAL CORREGIDA
 * Descripción: Funciones principales y configuración de la Web App
 * Versión: 1.2 - Bug de datos null SOLUCIONADO
 */

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================

const SPREADSHEET_ID = '1QFt6BFYtc8V_EIXqYROKo-aiqlDiRiBCTtb6IcbFERw';

const SHEETS = {
  CALIFICACIONES: 'BD_Calificaciones',
  ESTUDIANTES: 'Usuarios',
  COMPETENCIAS: 'Competencias',
  CONFIG: 'Config'
};

/**
 * Registra un array de calificaciones, incluyendo la información del docente,
 * en la hoja de cálculo de una sola vez.
 */
function registrarCalificacionesEnLote(calificacionesArray) {
  const usuarioActual = obtenerUsuarioPorEmail(Session.getActiveUser().getEmail());
  
  if (!usuarioActual || usuarioActual.rol !== 'Docente') {
    return { success: false, mensaje: 'Acceso no autorizado' };
  }
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
    
    const filasParaAgregar = calificacionesArray.map(datos => {
      const notaLiteral = convertirNotaALiteral(datos.calificacionNum); 
      
      // El array corresponde exactamente a las columnas A hasta O
      return [
        datos.idEstudiante,       // Columna A
        datos.apellidos,          // Columna B
        datos.nombres,            // Columna C
        datos.correo,             // Columna D
        datos.grado,              // Columna E
        datos.seccion,            // Columna F
        datos.area,               // Columna G
        datos.competencia,        // Columna H
        notaLiteral,              // Columna I
        datos.calificacionNum,    // Columna J
        datos.periodo,            // Columna K
        new Date(datos.fecha),    // Columna L
        datos.retroalimentacion || '', // Columna M
        usuarioActual.correo,     // Columna N
        usuarioActual.nombres     // Columna O
      ];
    });

    if (filasParaAgregar.length === 0) {
      return { success: false, mensaje: 'No se enviaron calificaciones para registrar.' };
    }

    const ultimaFila = sheet.getLastRow();
    // Esta línea se ajusta automáticamente a las 15 columnas
    sheet.getRange(ultimaFila + 1, 1, filasParaAgregar.length, filasParaAgregar[0].length)
         .setValues(filasParaAgregar);
         
    return { success: true, mensaje: `${filasParaAgregar.length} calificaciones fueron registradas exitosamente.` };

  } catch (error) {
    Logger.log('ERROR en registrarCalificacionesEnLote: ' + error.toString());
    return { success: false, mensaje: 'Error al registrar en lote: ' + error.toString() };
  }
}

// ============================================
// FUNCIÓN PRINCIPAL - WEB APP
// ============================================

// Archivo: Code.gs

// Archivo: Code.gs

// Archivo: Code.gs

// REEMPLAZA ESTA FUNCIÓN EN CODE.GS

function doGet(e) {
  try {
    const token = e.parameter.token; // Busca un 'token' en la URL (ej: ?token=xyz)
    const userEmail = obtenerEmailDesdeToken(token);

    // 1. Si el token no es válido o no existe, mostrar la página de Login.
    if (!userEmail) {
      return HtmlService.createTemplateFromFile('Login').evaluate()
        .setTitle('Ingreso al Sistema - CITEN');
    }
    
    // Si el token es válido, continuamos como antes...
    const usuario = obtenerUsuarioPorEmail(userEmail);

    if (!usuario) {
      // Si el usuario del token ya no existe en la BD, se muestra error.
      return crearPaginaError('El usuario asociado a esta sesión ya no existe.');
    }

    // 2. ENRUTADOR DE ROLES (esta parte no cambia)
    if (usuario.rol === 'Docente') {
      const template = HtmlService.createTemplateFromFile('Maestro');
      template.usuario = usuario;
      return template.evaluate()
        .setTitle('Panel del Docente - CITEN')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');

    } else if (usuario.rol === 'Estudiante') {
      const datosCompletos = obtenerDatosUsuarioActual(userEmail); // ¡IMPORTANTE! Pasamos el email
      if (datosCompletos.error) {
        return crearPaginaError('Error al obtener los datos del estudiante: ' + datosCompletos.error);
      }
      const template = HtmlService.createTemplateFromFile('Estudiante');
      template.usuario = datosCompletos.usuario;
      template.initialData = JSON.stringify(datosCompletos);
      return template.evaluate()
        .setTitle('Sistema de Notas - CITEN')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } else {
       return crearPaginaError('Tu rol no está definido en el sistema.');
    }
      
  } catch (error) {
    Logger.log('Error CRÍTICO en doGet: ' + error.toString());
    return crearPaginaError('Ha ocurrido un error inesperado al cargar la aplicación.');
  }
}
// ============================================
// FUNCIONES DE PÁGINAS DE ERROR
// ============================================

function crearPaginaError(mensaje) {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
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
          border-radius: 15px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          text-align: center;
          max-width: 500px;
        }
        h1 { color: #ef4444; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        a { color: #667eea; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ Error</h1>
        <p>${mensaje}</p>
        <p><a href="${ScriptApp.getService().getUrl()}">Intentar nuevamente</a></p>
      </div>
    </body>
    </html>
  `).setTitle('Error - Sistema de Notas');
}

function crearPaginaUsuarioNoRegistrado(email) {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
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
          border-radius: 15px;
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
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ Usuario No Registrado</h1>
        <p>El correo electrónico:</p>
        <div class="email">${email}</div>
        <p>No está registrado en el sistema.</p>
        <p>Por favor, contacta al administrador para que agregue tu correo a la lista de estudiantes.</p>
      </div>
    </body>
    </html>
  `).setTitle('Usuario No Registrado');
}

// ============================================
// FUNCIÓN PARA INCLUIR ARCHIVOS HTML
// ============================================

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN Y USUARIOS
// ============================================

/**
 * Carga TODOS los datos necesarios para el dashboard del ESTUDIANTE.
 * Esta es la versión que incluye el cálculo del historial y el nuevo reporte de notas.
 */
/**
 * Carga TODOS los datos necesarios para el dashboard del ESTUDIANTE.
 * Esta es la versión que incluye el historial y AMBOS reportes de notas.
 */
/**
 * Carga TODOS los datos necesarios para el dashboard del ESTUDIANTE.
 * Esta versión está adaptada para funcionar con el sistema de login manual (tokens).
 * @param {string} userEmail - El correo del usuario verificado, pasado como parámetro.
 */
function obtenerDatosUsuarioActual(userEmail) {
  try {
    // const userEmail = Session.getActiveUser().getEmail(); // SE ELIMINA ESTA LÍNEA

    const usuario = obtenerUsuarioPorEmail(userEmail);

    if (!usuario) {
      // Si no se encuentra el usuario, devuelve una estructura de datos vacía pero completa.
      return {
        error: 'Usuario no encontrado',
        usuario: null,
        calificaciones: [],
        promedios: { general: 0, porArea: {}, porCompetencia: {} },
        estadisticas: { total: 0, porNivel: { AD: 0, A: 0, B: 0, C: 0 } },
        historico: [],
        reporte: {},
        reporteSIGAN: {}
      };
    }
    
    // Se obtienen todos los datos necesarios usando el email proporcionado
    const calificaciones = obtenerCalificacionesPorEstudiante(userEmail);
    const promedios = calcularPromedios(calificaciones);
    const estadisticas = calcularEstadisticas(calificaciones);
    const historico = obtenerHistoricoProgreso(userEmail); 
    const datosReporte = obtenerDatosParaReporte(userEmail);
    const datosReporteSIGAN = obtenerDatosParaReporteSIGAN(userEmail);
    
    // Se construye el objeto final con todos los datos
    const resultado = {
      usuario: usuario,
      calificaciones: calificaciones || [],
      promedios: promedios || { general: 0, porArea: {}, porCompetencia: {} },
      estadisticas: estadisticas || { total: 0, porNivel: { AD: 0, A: 0, B: 0, C: 0 } },
      historico: historico || [],
      reporte: datosReporte || {},
      reporteSIGAN: datosReporteSIGAN || {}
    };
    
    return resultado;
    
  } catch (error) {
    Logger.log('ERROR CRÍTICO en obtenerDatosUsuarioActual: ' + error.toString());
    // En caso de un error inesperado, también devuelve una estructura completa y vacía.
    return {
      error: error.toString(),
      usuario: null,
      calificaciones: [],
      promedios: { general: 0, porArea: {}, porCompetencia: {} },
      estadisticas: { total: 0, porNivel: { AD: 0, A: 0, B: 0, C: 0 } },
      historico: [],
      reporte: {},
      reporteSIGAN: {}
    };
  }
}






// En Code.gs, modifica esta función
function obtenerUsuarioPorEmail(email) {
  try {
    // Asegúrate de que SHEETS.ESTUDIANTES ahora apunte a "Usuarios" en tus constantes globales
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.ESTUDIANTES); 
    
    if (!sheet) {
      Logger.log('ERROR: La hoja "Usuarios" no fue encontrada.');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    const emailBuscar = email.toString().toLowerCase().trim();
    
    // El bucle empieza en 1 para saltarse la fila de encabezados
    for (let i = 1; i < data.length; i++) {
      // Continuar solo si hay datos en la fila y en la columna de email
      if (!data[i][0] || !data[i][3]) continue;
      
      const emailFila = data[i][3].toString().toLowerCase().trim();
      
      if (emailFila === emailBuscar) {
        // Si encuentra el correo, construye el objeto del usuario
        return {
          id: data[i][0],
          apellidos: data[i][1] || '',
          nombres: data[i][2] || '',
          correo: data[i][3] || '',
          grado: data[i][4] || '',
          seccion: data[i][5] || '',
          fotoUrl: data[i][6] || 'https://via.placeholder.com/150',
          
          // --- LÍNEA CLAVE ---
          // Lee la columna H (índice 7 en el array) para obtener el rol.
          // Si la celda está vacía, asigna "Estudiante" por defecto.
          rol: data[i][7] || 'Estudiante' 
        };
      }
    }
    
    // Si el bucle termina y no encontró el email, retorna null.
    return null;
    
  } catch (error) {
    Logger.log('ERROR en obtenerUsuarioPorEmail: ' + error.toString());
    return null;
  }
}

function determinarRol(usuario) {
  return 'estudiante';
}

// ============================================
// FUNCIONES DE DATOS - CALIFICACIONES
// ============================================

function obtenerCalificacionesPorEstudiante(email) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
    
    if (!sheet) {
      Logger.log('ERROR: Hoja no encontrada: ' + SHEETS.CALIFICACIONES);
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const calificaciones = [];
    const emailBuscar = email.toString().toLowerCase().trim();
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      const emailFila = data[i][3] ? data[i][3].toString().toLowerCase().trim() : '';
      
      if (emailFila === emailBuscar) {
        calificaciones.push({
          id: data[i][0] || '',
          apellidos: data[i][1] || '',
          nombres: data[i][2] || '',
          correo: data[i][3] || '',
          grado: data[i][4] || '',
          seccion: data[i][5] || '',
          area: data[i][6] || '',
          competencia: data[i][7] || '',
          calificacion: data[i][8] || '',
          calificacionNum: data[i][9] || 0,
          periodo: data[i][10] || '',
          fecha: data[i][11] || new Date(),
          retroalimentacion: data[i][12] || ''
        });
      }
    }
    
    Logger.log('Calificaciones encontradas: ' + calificaciones.length);
    return calificaciones;
    
  } catch (error) {
    Logger.log('ERROR en obtenerCalificacionesPorEstudiante: ' + error.toString());
    return [];
  }
}

function obtenerTodasCalificaciones() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const calificaciones = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      calificaciones.push({
        id: data[i][0],
        apellidos: data[i][1],
        nombres: data[i][2],
        correo: data[i][3],
        grado: data[i][4],
        seccion: data[i][5],
        area: data[i][6],
        competencia: data[i][7],
        calificacion: data[i][8],
        calificacionNum: data[i][9],
        periodo: data[i][10],
        fecha: data[i][11],
        retroalimentacion: data[i][12] || ''
      });
    }
    
    return calificaciones;
  } catch (error) {
    Logger.log('ERROR en obtenerTodasCalificaciones: ' + error.toString());
    return [];
  }
}

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

function calcularPromedios(calificaciones) {
  const promedios = {
    general: 0,
    porArea: {},
    porCompetencia: {}
  };
  
  if (!calificaciones || calificaciones.length === 0) {
    return promedios;
  }
  
  let sumaTotal = 0;
  let contadorTotal = 0;
  
  calificaciones.forEach(cal => {
    const area = cal.area;
    const competencia = cal.competencia;
    const nota = parseFloat(cal.calificacionNum) || 0;
    
    if (!promedios.porArea[area]) {
      promedios.porArea[area] = { suma: 0, contador: 0, promedio: 0 };
    }
    promedios.porArea[area].suma += nota;
    promedios.porArea[area].contador += 1;
    
    const key = `${area} - ${competencia}`;
    if (!promedios.porCompetencia[key]) {
      promedios.porCompetencia[key] = { suma: 0, contador: 0, promedio: 0, area: area };
    }
    promedios.porCompetencia[key].suma += nota;
    promedios.porCompetencia[key].contador += 1;
    
    sumaTotal += nota;
    contadorTotal += 1;
  });
  
  promedios.general = contadorTotal > 0 ? (sumaTotal / contadorTotal).toFixed(2) : '0.00';
  
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

function calcularEstadisticas(calificaciones) {
  let totalAD = 0, totalA = 0, totalB = 0, totalC = 0;
  
  if (!calificaciones) {
    return {
      total: 0,
      porNivel: { AD: 0, A: 0, B: 0, C: 0 },
      porcentajes: { AD: '0.0', A: '0.0', B: '0.0', C: '0.0' }
    };
  }
  
  calificaciones.forEach(cal => {
    switch(cal.calificacion) {
      case 'AD': totalAD++; break;
      case 'A': totalA++; break;
      case 'B': totalB++; break;
      case 'C': totalC++; break;
    }
  });
  
  const total = calificaciones.length;
  
  return {
    total: total,
    porNivel: {
      AD: totalAD,
      A: totalA,
      B: totalB,
      C: totalC
    },
    porcentajes: {
      AD: total > 0 ? ((totalAD / total) * 100).toFixed(1) : '0.0',
      A: total > 0 ? ((totalA / total) * 100).toFixed(1) : '0.0',
      B: total > 0 ? ((totalB / total) * 100).toFixed(1) : '0.0',
      C: total > 0 ? ((totalC / total) * 100).toFixed(1) : '0.0'
    }
  };
}

function convertirNotaALiteral(nota) {
  nota = parseFloat(nota);
  if (nota >= 18) return 'AD';
  if (nota >= 14) return 'A';
  if (nota >= 11) return 'B';
  return 'C';
}

// ============================================
// FUNCIONES DE REGISTROS
// ============================================

function registrarCalificacion(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
    
    const notaLiteral = datos.calificacion || convertirNotaALiteral(datos.calificacionNum);
    
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
    Logger.log('ERROR en registrarCalificacion: ' + error.toString());
    return { success: false, mensaje: 'Error al registrar: ' + error.toString() };
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function obtenerConfiguracion() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CONFIG);
    
    if (!sheet) return {};
    
    const data = sheet.getDataRange().getValues();
    const config = {};
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        config[data[i][0]] = data[i][1];
      }
    }
    
    return config;
  } catch (error) {
    Logger.log('ERROR en obtenerConfiguracion: ' + error.toString());
    return {};
  }
}

// ============================================
// FUNCIÓN DE TEST
// ============================================

function testConexion() {
  Logger.log('==========================================');
  Logger.log('INICIANDO TEST DE CONEXIÓN');
  Logger.log('==========================================');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Hoja de cálculo conectada: ' + ss.getName());
    
    const estudiantesSheet = ss.getSheetByName(SHEETS.ESTUDIANTES);
    if (estudiantesSheet) {
      const totalEstudiantes = estudiantesSheet.getLastRow() - 1;
      Logger.log('✅ Hoja Estudiantes: ' + totalEstudiantes + ' estudiantes');
      
      const data = estudiantesSheet.getRange(2, 4, Math.min(3, totalEstudiantes), 1).getValues();
      Logger.log('   Primeros correos:');
      data.forEach((row, index) => {
        if (row[0]) Logger.log('   ' + (index + 1) + '. ' + row[0]);
      });
    }
    
    const calificacionesSheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
    if (calificacionesSheet) {
      const totalCalif = calificacionesSheet.getLastRow() - 1;
      Logger.log('✅ Hoja Calificaciones: ' + totalCalif + ' registros');
    }
    
    Logger.log('==========================================');
    Logger.log('✅ TEST COMPLETADO EXITOSAMENTE');
    Logger.log('==========================================');
    Logger.log('URL: ' + ScriptApp.getService().getUrl());
    
  } catch (error) {
    Logger.log('==========================================');
    Logger.log('❌ ERROR EN TEST');
    Logger.log('==========================================');
    Logger.log(error.toString());
  }
}

function debugUsuarioActual() {
  Logger.log('🔍 Debug manual iniciado...');
  const resultado = obtenerDatosUsuarioActual();
  Logger.log('Resultado:');
  Logger.log(JSON.stringify(resultado, null, 2));
  return resultado;
}

// ============================================
// MENÚ PERSONALIZADO
// ============================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Sistema de Notas')
    .addItem('🚀 Abrir Web App', 'abrirWebApp')
    .addItem('🔧 Test de Conexión', 'testConexion')
    .addItem('🐛 Debug Usuario Actual', 'debugUsuarioActual')
    .addSeparator()
    .addItem('📖 Ayuda', 'mostrarAyuda')
    .addToUi();
}

function abrirWebApp() {
  const url = ScriptApp.getService().getUrl();
  const html = '<html><script>window.open("' + url + '");google.script.host.close();</script></html>';
  const ui = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(ui, 'Abriendo Web App...');
}

function mostrarAyuda() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Sistema de Reportes Académicos - CITEN',
    'PASOS PARA IMPLEMENTAR:\n\n' +
    '1. Asegúrate de tener datos en: Estudiantes y BD_Calificaciones\n\n' +
    '2. Ve a Implementar > Nueva implementación > Aplicación web\n\n' +
    '3. Configura:\n' +
    '   - Ejecutar como: "Yo"\n' +
    '   - Acceso: "Cualquier usuario"\n\n' +
    '4. Copia la URL y compártela\n\n' +
    '5. Usa "Test de Conexión" para verificar\n\n' +
    '6. Usa "Debug Usuario Actual" para ver logs detallados',
    ui.ButtonSet.OK
  );
}

// Archivo: Code.gs (Agregar al final)

/**
* Función que expone datos seguros al frontend de la página de Login.
* Devuelve el email del usuario actual y la URL de la aplicación.
*/
function getLoginInfo() {
  const email = Session.getActiveUser().getEmail();
  const url = ScriptApp.getService().getUrl();
  return {
    email: email,
    appUrl: url
  };
}


// Agrega estas funciones en Code.gs o donde prefieras

/**
 * Devuelve una lista de todos los estudiantes para un selector (dropdown).
 */
function obtenerListaDeEstudiantes() {
  // OBTENER ROL PARA SEGURIDAD
  const usuarioActual = obtenerUsuarioPorEmail(Session.getActiveUser().getEmail());
  if (usuarioActual.rol !== 'Docente') {
    return { error: 'Acceso no autorizado' };
  }

  const todosLosUsuarios = obtenerTodosEstudiantes(); // Esta función ya la tienes en Database.gs
  // Filtrar solo para devolver estudiantes
  const estudiantes = todosLosUsuarios.filter(u => u.rol === 'Estudiante'); 
  return estudiantes;
}

/**
 * Guarda una nueva calificación enviada desde el panel del docente.
 */
function guardarNuevaCalificacion(datosCalificacion) {
  // OBTENER ROL PARA SEGURIDAD
  const usuarioActual = obtenerUsuarioPorEmail(Session.getActiveUser().getEmail());
  if (usuarioActual.rol !== 'Docente') {
    return { success: false, mensaje: 'Acceso no autorizado' };
  }
  
  // Aquí va la lógica para añadir la nueva fila en la hoja "BD_Calificaciones"
  // Puedes reutilizar o adaptar la función 'registrarCalificacion' que ya tienes.
  // Es importante validar que todos los datos (idEstudiante, area, etc.) vengan completos.
  return registrarCalificacion(datosCalificacion); // Reutilizamos la función existente
}

// AÑADE ESTA FUNCIÓN A CODE.GS

/**
 * Verifica las credenciales de un usuario contra la hoja 'Usuarios'.
 * @param {string} email El correo ingresado por el usuario.
 * @param {string} id El ID/DNI del usuario, usado como contraseña.
 * @returns {Object} Un objeto con el resultado de la validación y un token si es exitoso.
 */
function verificarCredenciales(email, id) {
  try {
    const usuario = obtenerUsuarioPorEmail(email);

    // 1. Verifica si el usuario existe
    if (!usuario) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    // 2. Verifica si la "contraseña" (el ID/DNI) coincide.
    // Comparamos como string para evitar errores de tipo.
    if (String(usuario.id).trim() === String(id).trim()) {
      // 3. Si las credenciales son correctas, creamos un token temporal.
      // Este token nos permitirá "recordar" al usuario en la siguiente carga de página.
      const token = generarTokenTemporal(email);
      return { success: true, token: token };
    } else {
      return { success: false, message: 'Contraseña incorrecta.' };
    }
  } catch (e) {
    return { success: false, message: 'Error en el servidor: ' + e.toString() };
  }
}

/**
 * Genera un token simple y lo guarda en el caché con una validez de 10 minutos.
 * @param {string} email El email del usuario para asociar al token.
 * @returns {string} El token generado.
 */
function generarTokenTemporal(email) {
  const token = `token_${Date.now()}_${Math.random()}`;
  // CacheService nos permite guardar datos temporalmente en el servidor.
  const cache = CacheService.getScriptCache();
  cache.put(token, email, 600); // Guardar por 600 segundos (10 minutos)
  return token;
}

/**
 * Obtiene el email del usuario a partir de un token temporal.
 * @param {string} token El token a verificar.
 * @returns {string|null} El email del usuario o null si el token no es válido.
 */
function obtenerEmailDesdeToken(token) {
  if (!token) return null;
  const cache = CacheService.getScriptCache();
  return cache.get(token);
}
