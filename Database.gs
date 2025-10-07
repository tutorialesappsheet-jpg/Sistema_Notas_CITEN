/**
 * SISTEMA DE REPORTES ACADÉMICOS - CITEN
 * Archivo: Database.gs
 * Descripción: Funciones avanzadas de acceso y manipulación de datos
 * ID Hoja: 1QFt6BFYtc8V_EIXqYROKo-aiqlDiRiBCTtb6IcbFERw
 */

// ============================================
// FUNCIONES DE LECTURA AVANZADA
// ============================================

/**
 * Obtiene todos los estudiantes registrados
 * @returns {Array} Lista de estudiantes
 */


function obtenerTodosEstudiantes() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.ESTUDIANTES);
  const data = sheet.getDataRange().getValues();
  
  const estudiantes = [];
  
  // Saltar encabezados
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // Solo si tiene ID
      estudiantes.push({
        id: data[i][0],
        apellidos: data[i][1],
        nombres: data[i][2],
        nombreCompleto: `${data[i][1]}, ${data[i][2]}`,
        correo: data[i][3],
        grado: data[i][4],
        seccion: data[i][5],
        fotoUrl: data[i][6] || 'https://via.placeholder.com/150'
      });
    }
  }
  
  return estudiantes;
}

/**
 * Obtiene todas las competencias disponibles
 * @returns {Array} Lista de competencias por área
 */
function obtenerTodasCompetencias() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.COMPETENCIAS);
  const data = sheet.getDataRange().getValues();
  
  const competencias = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      competencias.push({
        area: data[i][0],
        competencia: data[i][1],
        descripcion: data[i][2],
        peso: data[i][3] || 1
      });
    }
  }
  
  return competencias;
}

/**
 * Obtiene competencias filtradas por área
 * @param {string} area - Nombre del área curricular
 * @returns {Array} Competencias del área especificada
 */
function obtenerCompetenciasPorArea(area) {
  const todasCompetencias = obtenerTodasCompetencias();
  return todasCompetencias.filter(comp => comp.area === area);
}

/**
 * Obtiene lista única de áreas curriculares
 * @returns {Array} Lista de áreas
 */
function obtenerAreas() {
  const competencias = obtenerTodasCompetencias();
  const areasUnicas = [...new Set(competencias.map(c => c.area))];
  return areasUnicas.sort();
}

/**
 * Obtiene lista única de periodos académicos
 * @returns {Array} Lista de periodos
 */
function obtenerPeriodos() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
  const data = sheet.getDataRange().getValues();
  
  const periodosSet = new Set();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][10]) { // Columna de periodo
      periodosSet.add(data[i][10]);
    }
  }
  
  return Array.from(periodosSet).sort();
}

// ============================================
// FUNCIONES DE FILTRADO AVANZADO
// ============================================

/**
 * Obtiene calificaciones filtradas por múltiples criterios
 * @param {Object} filtros - Objeto con criterios de filtrado
 * @returns {Array} Calificaciones filtradas
 */
function obtenerCalificacionesFiltradas(filtros) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
  const data = sheet.getDataRange().getValues();
  
  const calificaciones = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Crear objeto de calificación
    const cal = {
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
    };
    
    // Aplicar filtros
    let cumpleFiltros = true;
    
    if (filtros.email && cal.correo.toLowerCase() !== filtros.email.toLowerCase()) {
      cumpleFiltros = false;
    }
    
    if (filtros.area && cal.area !== filtros.area) {
      cumpleFiltros = false;
    }
    
    if (filtros.periodo && cal.periodo !== filtros.periodo) {
      cumpleFiltros = false;
    }
    
    if (filtros.grado && cal.grado !== filtros.grado) {
      cumpleFiltros = false;
    }
    
    if (filtros.seccion && cal.seccion !== filtros.seccion) {
      cumpleFiltros = false;
    }
    
    if (cumpleFiltros) {
      calificaciones.push(cal);
    }
  }
  
  return calificaciones;
}

/**
 * Obtiene calificaciones por periodo específico
 * @param {string} email - Email del estudiante
 * @param {string} periodo - Periodo académico
 * @returns {Array} Calificaciones del periodo
 */
function obtenerCalificacionesPorPeriodo(email, periodo) {
  return obtenerCalificacionesFiltradas({ email: email, periodo: periodo });
}

/**
 * Obtiene calificaciones por área específica
 * @param {string} email - Email del estudiante
 * @param {string} area - Área curricular
 * @returns {Array} Calificaciones del área
 */
function obtenerCalificacionesPorAreaEstudiante(email, area) {
  return obtenerCalificacionesFiltradas({ email: email, area: area });
}

// ============================================
// FUNCIONES DE ANÁLISIS Y ESTADÍSTICAS
// ============================================

/**
 * Calcula el promedio general de un estudiante
 * @param {string} email - Email del estudiante
 * @returns {Object} Promedio y estadísticas
 */
function calcularPromedioGeneral(email) {
  const calificaciones = obtenerCalificacionesPorEstudiante(email);
  
  if (calificaciones.length === 0) {
    return {
      promedio: 0,
      totalCalificaciones: 0,
      nivelLogro: 'Sin datos'
    };
  }
  
  let suma = 0;
  calificaciones.forEach(cal => {
    suma += parseFloat(cal.calificacionNum) || 0;
  });
  
  const promedio = suma / calificaciones.length;
  const nivelLogro = convertirNotaALiteral(promedio);
  
  return {
    promedio: promedio.toFixed(2),
    promedioNum: promedio,
    totalCalificaciones: calificaciones.length,
    nivelLogro: nivelLogro
  };
}

/**
 * Obtiene el ranking de estudiantes por grado y sección
 * @param {string} grado - Grado escolar
 * @param {string} seccion - Sección
 * @returns {Array} Estudiantes ordenados por promedio
 */
function obtenerRankingSeccion(grado, seccion) {
  const estudiantes = obtenerTodosEstudiantes();
  const estudiantesSeccion = estudiantes.filter(est => 
    est.grado === grado && est.seccion === seccion
  );
  
  const ranking = [];
  
  estudiantesSeccion.forEach(est => {
    const promedio = calcularPromedioGeneral(est.correo);
    ranking.push({
      estudiante: est,
      promedio: promedio.promedioNum,
      promedioTexto: promedio.promedio,
      nivelLogro: promedio.nivelLogro
    });
  });
  
  // Ordenar por promedio descendente
  ranking.sort((a, b) => b.promedio - a.promedio);
  
  // Agregar posición
  ranking.forEach((item, index) => {
    item.posicion = index + 1;
  });
  
  return ranking;
}

/**
 * Calcula estadísticas completas de un estudiante por periodo
 * @param {string} email - Email del estudiante
 * @param {string} periodo - Periodo académico
 * @returns {Object} Estadísticas detalladas
 */
function calcularEstadisticasPorPeriodo(email, periodo) {
  const calificaciones = obtenerCalificacionesPorPeriodo(email, periodo);
  
  const stats = {
    periodo: periodo,
    totalNotas: calificaciones.length,
    promedio: 0,
    nivelLogro: '',
    porArea: {},
    distribucion: { AD: 0, A: 0, B: 0, C: 0 },
    mejorArea: '',
    areasMejorar: []
  };
  
  if (calificaciones.length === 0) {
    return stats;
  }
  
  // Calcular promedio general
  let sumaTotal = 0;
  calificaciones.forEach(cal => {
    const nota = parseFloat(cal.calificacionNum) || 0;
    sumaTotal += nota;
    
    // Contar distribución
    stats.distribucion[cal.calificacion]++;
    
    // Agrupar por área
    if (!stats.porArea[cal.area]) {
      stats.porArea[cal.area] = {
        suma: 0,
        contador: 0,
        promedio: 0
      };
    }
    stats.porArea[cal.area].suma += nota;
    stats.porArea[cal.area].contador++;
  });
  
  stats.promedio = (sumaTotal / calificaciones.length).toFixed(2);
  stats.nivelLogro = convertirNotaALiteral(stats.promedio);
  
  // Calcular promedios por área
  let mejorPromedio = 0;
  for (let area in stats.porArea) {
    const prom = stats.porArea[area].suma / stats.porArea[area].contador;
    stats.porArea[area].promedio = prom.toFixed(2);
    stats.porArea[area].nivelLogro = convertirNotaALiteral(prom);
    
    if (prom > mejorPromedio) {
      mejorPromedio = prom;
      stats.mejorArea = area;
    }
  }
  
  // Identificar áreas a mejorar (promedio < 14)
  for (let area in stats.porArea) {
    if (parseFloat(stats.porArea[area].promedio) < 14) {
      stats.areasMejorar.push(area);
    }
  }
  
  return stats;
}

/**
 * Obtiene el histórico de progreso de un estudiante
 * @param {string} email - Email del estudiante
 * @returns {Array} Progreso por periodo
 */
function obtenerHistoricoProgreso(email) {
  const periodos = obtenerPeriodos();
  const historico = [];
  
  periodos.forEach(periodo => {
    const stats = calcularEstadisticasPorPeriodo(email, periodo);
    historico.push({
      periodo: periodo,
      promedio: stats.promedio,
      nivelLogro: stats.nivelLogro,
      totalNotas: stats.totalNotas
    });
  });
  
  return historico;
}

// ============================================
// FUNCIONES DE ESCRITURA
// ============================================

/**
 * Actualiza una calificación existente
 * @param {number} fila - Número de fila en la hoja (base 1)
 * @param {Object} datos - Nuevos datos de la calificación
 * @returns {Object} Resultado de la operación
 */
function actualizarCalificacion(fila, datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
    
    // Convertir nota numérica a literal si es necesario
    const notaLiteral = datos.calificacion || convertirNotaALiteral(datos.calificacionNum);
    
    // Actualizar la fila (fila es base 1, pero el array es base 0)
    sheet.getRange(fila, 1, 1, 13).setValues([[
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
    ]]);
    
    return { success: true, mensaje: 'Calificación actualizada correctamente' };
  } catch (error) {
    return { success: false, mensaje: 'Error al actualizar: ' + error.toString() };
  }
}

/**
 * Elimina una calificación
 * @param {number} fila - Número de fila a eliminar (base 1)
 * @returns {Object} Resultado de la operación
 */
function eliminarCalificacion(fila) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
    
    sheet.deleteRow(fila);
    
    return { success: true, mensaje: 'Calificación eliminada correctamente' };
  } catch (error) {
    return { success: false, mensaje: 'Error al eliminar: ' + error.toString() };
  }
}

/**
 * Registra múltiples calificaciones de una vez (importación masiva)
 * @param {Array} calificaciones - Array de objetos con calificaciones
 * @returns {Object} Resultado de la operación
 */
function registrarCalificacionesMasivas(calificaciones) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CALIFICACIONES);
    
    const filas = [];
    
    calificaciones.forEach(datos => {
      const notaLiteral = datos.calificacion || convertirNotaALiteral(datos.calificacionNum);
      
      filas.push([
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
    });
    
    // Agregar todas las filas de una vez (más eficiente)
    sheet.getRange(sheet.getLastRow() + 1, 1, filas.length, 13).setValues(filas);
    
    return { 
      success: true, 
      mensaje: `${calificaciones.length} calificaciones registradas correctamente` 
    };
  } catch (error) {
    return { success: false, mensaje: 'Error al registrar masivamente: ' + error.toString() };
  }
}

// ============================================
// FUNCIONES DE EXPORTACIÓN
// ============================================

/**
 * Exporta calificaciones a formato CSV
 * @param {Object} filtros - Criterios de filtrado
 * @returns {string} Datos en formato CSV
 */
function exportarACSV(filtros) {
  const calificaciones = obtenerCalificacionesFiltradas(filtros);
  
  let csv = 'ID,Apellidos,Nombres,Correo,Grado,Seccion,Area,Competencia,Calificacion,Nota,Periodo,Fecha,Retroalimentacion\n';
  
  calificaciones.forEach(cal => {
    csv += `${cal.id},"${cal.apellidos}","${cal.nombres}",${cal.correo},${cal.grado},${cal.seccion},"${cal.area}","${cal.competencia}",${cal.calificacion},${cal.calificacionNum},${cal.periodo},${cal.fecha},"${cal.retroalimentacion}"\n`;
  });
  
  return csv;
}

/**
 * Genera reporte consolidado para SIGAN
 * @param {string} periodo - Periodo a exportar
 * @returns {Array} Datos formateados para SIGAN
 */
function generarReporteSIGAN(periodo) {
  const estudiantes = obtenerTodosEstudiantes();
  const reporte = [];
  
  estudiantes.forEach(est => {
    const stats = calcularEstadisticasPorPeriodo(est.correo, periodo);
    
    reporte.push({
      id: est.id,
      apellidos: est.apellidos,
      nombres: est.nombres,
      grado: est.grado,
      seccion: est.seccion,
      periodo: periodo,
      promedio: stats.promedio,
      nivelLogro: stats.nivelLogro,
      porArea: stats.porArea
    });
  });
  
  return reporte;
}

// ============================================
// FUNCIONES DE UTILIDAD Y BÚSQUEDA
// ============================================

/**
 * Busca estudiantes por nombre o apellido
 * @param {string} termino - Término de búsqueda
 * @returns {Array} Estudiantes que coinciden
 */
function buscarEstudiantes(termino) {
  const todosEstudiantes = obtenerTodosEstudiantes();
  const terminoLower = termino.toLowerCase();
  
  return todosEstudiantes.filter(est => 
    est.nombres.toLowerCase().includes(terminoLower) ||
    est.apellidos.toLowerCase().includes(terminoLower) ||
    est.nombreCompleto.toLowerCase().includes(terminoLower)
  );
}

/**
 * Obtiene estadísticas generales del aula
 * @param {string} grado - Grado escolar
 * @param {string} seccion - Sección
 * @returns {Object} Estadísticas del aula
 */
function obtenerEstadisticasAula(grado, seccion) {
  const estudiantes = obtenerTodosEstudiantes().filter(est =>
    est.grado === grado && est.seccion === seccion
  );
  
  const promedios = [];
  let sumaGeneral = 0;
  
  estudiantes.forEach(est => {
    const prom = calcularPromedioGeneral(est.correo);
    if (prom.totalCalificaciones > 0) {
      promedios.push(prom.promedioNum);
      sumaGeneral += prom.promedioNum;
    }
  });
  
  const stats = {
    totalEstudiantes: estudiantes.length,
    promedioAula: promedios.length > 0 ? (sumaGeneral / promedios.length).toFixed(2) : 0,
    mejorPromedio: promedios.length > 0 ? Math.max(...promedios).toFixed(2) : 0,
    menorPromedio: promedios.length > 0 ? Math.min(...promedios).toFixed(2) : 0,
    estudiantesEnRiesgo: promedios.filter(p => p < 11).length
  };
  
  return stats;
}

// ============================================
// FUNCIONES DE NOTIFICACIONES
// ============================================

/**
 * Envía notificación por email cuando se registra una nueva nota
 * @param {string} email - Email del estudiante
 * @param {Object} datosNota - Datos de la nota registrada
 * @returns {Object} Resultado del envío
 */
function enviarNotificacionNuevaNota(email, datosNota) {
  try {
    const asunto = `📊 Nueva calificación registrada - ${datosNota.area}`;
    const cuerpo = `
      Estimado(a) estudiante,
      
      Se ha registrado una nueva calificación:
      
      📚 Área: ${datosNota.area}
      🎯 Competencia: ${datosNota.competencia}
      ✅ Calificación: ${datosNota.calificacion} (${datosNota.calificacionNum})
      📅 Periodo: ${datosNota.periodo}
      
      💬 Retroalimentación del docente:
      ${datosNota.retroalimentacion || 'Sin comentarios'}
      
      Revisa tu dashboard completo en: ${ScriptApp.getService().getUrl()}
      
      ---
      Sistema de Reportes Académicos - CITEN
    `;
    
    MailApp.sendEmail(email, asunto, cuerpo);
    
    return { success: true, mensaje: 'Notificación enviada' };
  } catch (error) {
    return { success: false, mensaje: 'Error al enviar email: ' + error.toString() };
  }
}

/**
 * Función de prueba para verificar todas las funciones de Database
 */
function testDatabase() {
  Logger.log('=== TEST DATABASE.GS ===');
  
  Logger.log('\n1. Obtener todos los estudiantes:');
  const estudiantes = obtenerTodosEstudiantes();
  Logger.log('Total: ' + estudiantes.length);
  
  Logger.log('\n2. Obtener áreas curriculares:');
  const areas = obtenerAreas();
  Logger.log(areas);
  
  Logger.log('\n3. Obtener periodos:');
  const periodos = obtenerPeriodos();
  Logger.log(periodos);
  
  if (estudiantes.length > 0) {
    const emailTest = estudiantes[0].correo;
    
    Logger.log('\n4. Promedio general de ' + emailTest + ':');
    const promedio = calcularPromedioGeneral(emailTest);
    Logger.log(promedio);
    
    Logger.log('\n5. Histórico de progreso:');
    const historico = obtenerHistoricoProgreso(emailTest);
    Logger.log(historico);
  }
  
  Logger.log('\n✅ Test de Database completado');
}
