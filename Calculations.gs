/**
 * SISTEMA DE REPORTES ACADÉMICOS - CITEN
 * Archivo: Calculations.gs
 * Descripción: Funciones especializadas de cálculos académicos y análisis de datos
 * Enfocado en la rúbrica de evaluación peruana por competencias
 */

// ============================================
// CONSTANTES DE EVALUACIÓN PERUANA
// ============================================

const NIVELES_LOGRO = {
  AD: { min: 18, max: 20, nombre: 'Logro Destacado', color: '#10b981', descripcion: 'Evidencia un nivel superior a lo esperado' },
  A: { min: 14, max: 17, nombre: 'Logro Esperado', color: '#3b82f6', descripcion: 'Evidencia el nivel esperado' },
  B: { min: 11, max: 13, nombre: 'En Proceso', color: '#f59e0b', descripcion: 'Está próximo o cerca al nivel esperado' },
  C: { min: 0, max: 10, nombre: 'En Inicio', color: '#ef4444', descripcion: 'Muestra un progreso mínimo' }
};

const ESCALA_PRIMARIA = {
  AD: 'Logro Destacado',
  A: 'Logro Esperado', 
  B: 'En Proceso',
  C: 'En Inicio'
};

// ============================================
// CONVERSIONES Y VALIDACIONES
// ============================================

/**
 * Convierte calificación numérica a literal según escala peruana
 * @param {number} nota - Calificación numérica (0-20)
 * @returns {string} Calificación literal (AD/A/B/C)
 */
function convertirNotaALiteralDetallado(nota) {
  nota = parseFloat(nota);
  
  if (isNaN(nota)) return 'C';
  if (nota >= 18) return 'AD';
  if (nota >= 14) return 'A';
  if (nota >= 11) return 'B';
  return 'C';
}

/**
 * Obtiene información completa del nivel de logro
 * @param {string} nivel - Nivel literal (AD/A/B/C)
 * @returns {Object} Información del nivel
 */
function obtenerInfoNivelLogro(nivel) {
  return NIVELES_LOGRO[nivel] || NIVELES_LOGRO.C;
}

/**
 * Valida si una calificación es válida en el sistema peruano
 * @param {number} nota - Calificación a validar
 * @returns {Object} Resultado de la validación
 */
function validarCalificacion(nota) {
  nota = parseFloat(nota);
  
  if (isNaN(nota)) {
    return { valido: false, mensaje: 'La nota debe ser un número' };
  }
  
  if (nota < 0 || nota > 20) {
    return { valido: false, mensaje: 'La nota debe estar entre 0 y 20' };
  }
  
  return { valido: true, nota: nota };
}

// ============================================
// CÁLCULOS DE PROMEDIOS AVANZADOS
// ============================================

/**
 * Calcula promedio ponderado considerando pesos de competencias
 * @param {Array} calificaciones - Array de calificaciones con sus pesos
 * @returns {Object} Promedio ponderado y detalles
 */
function calcularPromedioPonderado(calificaciones) {
  let sumaPonderada = 0;
  let sumaPesos = 0;
  
  calificaciones.forEach(cal => {
    const nota = parseFloat(cal.calificacionNum) || 0;
    const peso = parseFloat(cal.peso) || 1;
    
    sumaPonderada += nota * peso;
    sumaPesos += peso;
  });
  
  const promedio = sumaPesos > 0 ? sumaPonderada / sumaPesos : 0;
  
  return {
    promedio: promedio.toFixed(2),
    promedioNum: promedio,
    nivelLogro: convertirNotaALiteralDetallado(promedio),
    totalCalificaciones: calificaciones.length,
    pesoTotal: sumaPesos
  };
}

/**
 * Calcula promedio por competencias según criterios del MINEDU
 * Considera la tendencia y progresión del estudiante
 * @param {Array} calificaciones - Calificaciones de una competencia específica
 * @returns {Object} Nivel de logro de la competencia
 */
function calcularNivelCompetencia(calificaciones) {
  if (calificaciones.length === 0) {
    return {
      nivel: 'C',
      promedio: 0,
      tendencia: 'sin datos',
      descripcion: 'Sin evaluaciones registradas'
    };
  }
  
  // Ordenar por fecha (más recientes primero)
  const calOrdenadas = calificaciones.sort((a, b) => 
    new Date(b.fecha) - new Date(a.fecha)
  );
  
  // Dar más peso a las evaluaciones más recientes
  let sumaTotal = 0;
  let pesoTotal = 0;
  
  calOrdenadas.forEach((cal, index) => {
    const nota = parseFloat(cal.calificacionNum) || 0;
    // Las notas más recientes tienen más peso (peso decreciente)
    const peso = 1 / (index + 1);
    
    sumaTotal += nota * peso;
    pesoTotal += peso;
  });
  
  const promedioPonderado = sumaTotal / pesoTotal;
  
  // Calcular tendencia (comparar últimas 3 vs primeras 3)
  let tendencia = 'estable';
  if (calOrdenadas.length >= 3) {
    const promedioReciente = (
      parseFloat(calOrdenadas[0].calificacionNum) +
      parseFloat(calOrdenadas[1].calificacionNum) +
      parseFloat(calOrdenadas[2].calificacionNum)
    ) / 3;
    
    const promedioAntiguo = (
      parseFloat(calOrdenadas[calOrdenadas.length - 3].calificacionNum) +
      parseFloat(calOrdenadas[calOrdenadas.length - 2].calificacionNum) +
      parseFloat(calOrdenadas[calOrdenadas.length - 1].calificacionNum)
    ) / 3;
    
    if (promedioReciente > promedioAntiguo + 1) tendencia = 'mejorando';
    else if (promedioReciente < promedioAntiguo - 1) tendencia = 'descendiendo';
  }
  
  const nivel = convertirNotaALiteralDetallado(promedioPonderado);
  const infoNivel = obtenerInfoNivelLogro(nivel);
  
  return {
    nivel: nivel,
    promedio: promedioPonderado.toFixed(2),
    promedioNum: promedioPonderado,
    tendencia: tendencia,
    descripcion: infoNivel.descripcion,
    totalEvaluaciones: calificaciones.length,
    ultimaNota: calOrdenadas[0].calificacionNum,
    fechaUltima: calOrdenadas[0].fecha
  };
}

/**
 * Calcula el nivel de logro consolidado por área curricular
 * Agrupa por competencias y luego calcula el nivel del área
 * @param {string} email - Email del estudiante
 * @param {string} area - Área curricular
 * @param {string} periodo - Periodo académico (opcional)
 * @returns {Object} Análisis completo del área
 */
function calcularNivelArea(email, area, periodo = null) {
  let calificaciones;
  
  if (periodo) {
    calificaciones = obtenerCalificacionesFiltradas({ 
      email: email, 
      area: area, 
      periodo: periodo 
    });
  } else {
    calificaciones = obtenerCalificacionesFiltradas({ 
      email: email, 
      area: area 
    });
  }
  
  if (calificaciones.length === 0) {
    return {
      area: area,
      nivel: 'C',
      promedio: 0,
      competencias: {},
      totalEvaluaciones: 0
    };
  }
  
  // Agrupar por competencia
  const porCompetencia = {};
  
  calificaciones.forEach(cal => {
    if (!porCompetencia[cal.competencia]) {
      porCompetencia[cal.competencia] = [];
    }
    porCompetencia[cal.competencia].push(cal);
  });
  
  // Calcular nivel de cada competencia
  const nivelesCompetencias = {};
  let sumaPromedios = 0;
  let contadorCompetencias = 0;
  
  for (let competencia in porCompetencia) {
    const nivel = calcularNivelCompetencia(porCompetencia[competencia]);
    nivelesCompetencias[competencia] = nivel;
    sumaPromedios += parseFloat(nivel.promedioNum);
    contadorCompetencias++;
  }
  
  const promedioArea = sumaPromedios / contadorCompetencias;
  
  return {
    area: area,
    nivel: convertirNotaALiteralDetallado(promedioArea),
    promedio: promedioArea.toFixed(2),
    promedioNum: promedioArea,
    competencias: nivelesCompetencias,
    totalCompetencias: contadorCompetencias,
    totalEvaluaciones: calificaciones.length,
    periodo: periodo
  };
}

// ============================================
// ANÁLISIS COMPARATIVO
// ============================================

/**
 * Compara el rendimiento del estudiante con el promedio del aula
 * @param {string} email - Email del estudiante
 * @param {string} grado - Grado escolar
 * @param {string} seccion - Sección
 * @returns {Object} Análisis comparativo
 */
function compararConAula(email, grado, seccion) {
  const promedioEstudiante = calcularPromedioGeneral(email);
  const statsAula = obtenerEstadisticasAula(grado, seccion);
  
  const diferencia = promedioEstudiante.promedioNum - parseFloat(statsAula.promedioAula);
  
  let posicionRelativa;
  if (diferencia > 2) posicionRelativa = 'Por encima del promedio';
  else if (diferencia < -2) posicionRelativa = 'Por debajo del promedio';
  else posicionRelativa = 'En el promedio';
  
  return {
    promedioEstudiante: promedioEstudiante.promedio,
    promedioAula: statsAula.promedioAula,
    diferencia: diferencia.toFixed(2),
    posicionRelativa: posicionRelativa,
    mejorPromedioAula: statsAula.mejorPromedio,
    diferenciaConMejor: (promedioEstudiante.promedioNum - parseFloat(statsAula.mejorPromedio)).toFixed(2)
  };
}

/**
 * Compara el rendimiento entre dos periodos
 * @param {string} email - Email del estudiante
 * @param {string} periodo1 - Primer periodo
 * @param {string} periodo2 - Segundo periodo
 * @returns {Object} Análisis comparativo entre periodos
 */
function compararPeriodos(email, periodo1, periodo2) {
  const stats1 = calcularEstadisticasPorPeriodo(email, periodo1);
  const stats2 = calcularEstadisticasPorPeriodo(email, periodo2);
  
  const diferencia = parseFloat(stats2.promedio) - parseFloat(stats1.promedio);
  
  let evolucion;
  if (diferencia > 1) evolucion = 'Mejoró significativamente';
  else if (diferencia > 0) evolucion = 'Mejoró levemente';
  else if (diferencia === 0) evolucion = 'Se mantuvo igual';
  else if (diferencia > -1) evolucion = 'Descendió levemente';
  else evolucion = 'Descendió significativamente';
  
  return {
    periodo1: {
      nombre: periodo1,
      promedio: stats1.promedio,
      nivel: stats1.nivelLogro
    },
    periodo2: {
      nombre: periodo2,
      promedio: stats2.promedio,
      nivel: stats2.nivelLogro
    },
    diferencia: diferencia.toFixed(2),
    evolucion: evolucion,
    porcentajeCambio: stats1.promedio > 0 ? ((diferencia / parseFloat(stats1.promedio)) * 100).toFixed(1) : 0
  };
}

// ============================================
// PREDICCIONES Y PROYECCIONES
// ============================================

/**
 * Calcula la proyección del promedio final basado en tendencia actual
 * @param {string} email - Email del estudiante
 * @returns {Object} Proyección del rendimiento
 */
function proyectarRendimiento(email) {
  const historico = obtenerHistoricoProgreso(email);
  
  if (historico.length < 2) {
    return {
      proyeccion: 'Insuficientes datos',
      confianza: 0
    };
  }
  
  // Calcular tendencia lineal simple
  let sumaX = 0, sumaY = 0, sumaXY = 0, sumaX2 = 0;
  
  historico.forEach((periodo, index) => {
    const x = index;
    const y = parseFloat(periodo.promedio);
    
    sumaX += x;
    sumaY += y;
    sumaXY += x * y;
    sumaX2 += x * x;
  });
  
  const n = historico.length;
  const pendiente = (n * sumaXY - sumaX * sumaY) / (n * sumaX2 - sumaX * sumaX);
  const intercepto = (sumaY - pendiente * sumaX) / n;
  
  // Proyectar próximo periodo
  const proyeccion = pendiente * n + intercepto;
  const nivelProyectado = convertirNotaALiteralDetallado(proyeccion);
  
  // Calcular confianza basada en variabilidad
  let variabilidad = 0;
  historico.forEach(periodo => {
    const diff = parseFloat(periodo.promedio) - (sumaY / n);
    variabilidad += diff * diff;
  });
  variabilidad = Math.sqrt(variabilidad / n);
  
  const confianza = Math.max(0, 100 - (variabilidad * 10));
  
  let tendencia;
  if (pendiente > 0.5) tendencia = 'Tendencia positiva';
  else if (pendiente < -0.5) tendencia = 'Tendencia negativa';
  else tendencia = 'Tendencia estable';
  
  return {
    proyeccion: proyeccion.toFixed(2),
    nivelProyectado: nivelProyectado,
    tendencia: tendencia,
    confianza: confianza.toFixed(0) + '%',
    pendiente: pendiente.toFixed(3),
    periodosAnalizados: n
  };
}

/**
 * Identifica áreas de riesgo académico
 * @param {string} email - Email del estudiante
 * @returns {Object} Análisis de riesgo
 */
function identificarAreasRiesgo(email) {
  const areas = obtenerAreas();
  const areasRiesgo = [];
  const areasFortaleza = [];
  
  areas.forEach(area => {
    const analisis = calcularNivelArea(email, area);
    
    if (parseFloat(analisis.promedio) < 11) {
      areasRiesgo.push({
        area: area,
        promedio: analisis.promedio,
        nivel: analisis.nivel,
        prioridad: 'alta'
      });
    } else if (parseFloat(analisis.promedio) < 14) {
      areasRiesgo.push({
        area: area,
        promedio: analisis.promedio,
        nivel: analisis.nivel,
        prioridad: 'media'
      });
    } else if (parseFloat(analisis.promedio) >= 18) {
      areasFortaleza.push({
        area: area,
        promedio: analisis.promedio,
        nivel: analisis.nivel
      });
    }
  });
  
  // Ordenar por prioridad y promedio
  areasRiesgo.sort((a, b) => {
    if (a.prioridad === 'alta' && b.prioridad !== 'alta') return -1;
    if (a.prioridad !== 'alta' && b.prioridad === 'alta') return 1;
    return parseFloat(a.promedio) - parseFloat(b.promedio);
  });
  
  areasFortaleza.sort((a, b) => parseFloat(b.promedio) - parseFloat(a.promedio));
  
  const nivelRiesgo = areasRiesgo.length === 0 ? 'bajo' : 
                      areasRiesgo.filter(a => a.prioridad === 'alta').length > 0 ? 'alto' : 'medio';
  
  return {
    nivelRiesgo: nivelRiesgo,
    areasRiesgo: areasRiesgo,
    areasFortaleza: areasFortaleza,
    totalAreasRiesgo: areasRiesgo.length,
    recomendacion: generarRecomendacion(areasRiesgo, areasFortaleza)
  };
}

/**
 * Genera recomendaciones personalizadas basadas en el análisis
 * @param {Array} areasRiesgo - Áreas con bajo rendimiento
 * @param {Array} areasFortaleza - Áreas con buen rendimiento
 * @returns {string} Recomendación personalizada
 */
function generarRecomendacion(areasRiesgo, areasFortaleza) {
  if (areasRiesgo.length === 0) {
    return 'Excelente rendimiento académico. Mantén tu esfuerzo y dedicación.';
  }
  
  if (areasRiesgo.length > 3) {
    return 'Se recomienda reforzamiento académico integral. Considera apoyo adicional con tus docentes.';
  }
  
  const areasTexto = areasRiesgo.map(a => a.area).join(', ');
  return `Enfoca tu esfuerzo en: ${areasTexto}. Solicita apoyo a tus docentes y dedica tiempo extra a estas áreas.`;
}

// ============================================
// GENERACIÓN DE DATOS PARA GRÁFICOS
// ============================================

/**
 * Prepara datos para gráfico de radar de competencias
 * @param {string} email - Email del estudiante
 * @returns {Object} Datos formateados para Google Charts
 */
function prepararDatosRadarCompetencias(email) {
  const areas = obtenerAreas();
  const datos = [['Área', 'Promedio']];
  
  areas.forEach(area => {
    const analisis = calcularNivelArea(email, area);
    datos.push([area, parseFloat(analisis.promedio)]);
  });
  
  return {
    datos: datos,
    opciones: {
      title: 'Rendimiento por Área Curricular',
      vAxis: { minValue: 0, maxValue: 20 }
    }
  };
}

/**
 * Prepara datos para gráfico de evolución temporal
 * @param {string} email - Email del estudiante
 * @returns {Object} Datos para gráfico de líneas
 */
function prepararDatosEvolucion(email) {
  const historico = obtenerHistoricoProgreso(email);
  const datos = [['Periodo', 'Promedio']];
  
  historico.forEach(periodo => {
    datos.push([periodo.periodo, parseFloat(periodo.promedio)]);
  });
  
  return {
    datos: datos,
    opciones: {
      title: 'Evolución del Rendimiento',
      hAxis: { title: 'Periodo' },
      vAxis: { title: 'Promedio', minValue: 0, maxValue: 20 }
    }
  };
}

/**
 * Prepara datos para gráfico de distribución de niveles
 * @param {string} email - Email del estudiante
 * @returns {Object} Datos para gráfico de torta
 */
function prepararDatosDistribucion(email) {
  const calificaciones = obtenerCalificacionesPorEstudiante(email);
  const stats = calcularEstadisticas(calificaciones);
  
  const datos = [
    ['Nivel', 'Cantidad'],
    ['AD - Logro Destacado', stats.porNivel.AD],
    ['A - Logro Esperado', stats.porNivel.A],
    ['B - En Proceso', stats.porNivel.B],
    ['C - En Inicio', stats.porNivel.C]
  ];
  
  return {
    datos: datos,
    opciones: {
      title: 'Distribución de Niveles de Logro',
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
    }
  };
}

// ============================================
// FUNCIÓN DE TEST
// ============================================

/**
 * Función de prueba para verificar cálculos
 */
function testCalculations() {
  Logger.log('=== TEST CALCULATIONS.GS ===');
  
  const estudiantes = obtenerTodosEstudiantes();
  
  if (estudiantes.length > 0) {
    const emailTest = estudiantes[0].correo;
    Logger.log('\nEstudiante de prueba: ' + emailTest);
    
    Logger.log('\n1. Promedio General:');
    const promedio = calcularPromedioGeneral(emailTest);
    Logger.log(promedio);
    
    Logger.log('\n2. Proyección de rendimiento:');
    const proyeccion = proyectarRendimiento(emailTest);
    Logger.log(proyeccion);
    
    Logger.log('\n3. Áreas de riesgo:');
    const riesgo = identificarAreasRiesgo(emailTest);
    Logger.log(riesgo);
    
    const areas = obtenerAreas();
    if (areas.length > 0) {
      Logger.log('\n4. Nivel del área ' + areas[0] + ':');
      const nivelArea = calcularNivelArea(emailTest, areas[0]);
      Logger.log(nivelArea);
    }
  }
  
  Logger.log('\n✅ Test de Calculations completado');
}


// Añade esta función en Database.gs o Calculations.gs

/**
 * Procesa y agrupa las calificaciones de un estudiante para el formato de Reporte de Notas.
 * @param {string} email - El correo del estudiante.
 * @returns {Object} Un objeto con las calificaciones agrupadas por Área y luego por Competencia.
 */
function obtenerDatosParaReporte(email) {
  const calificaciones = obtenerCalificacionesPorEstudiante(email);
  const reporte = {};

  calificaciones.forEach(cal => {
    const area = cal.area;
    const competencia = cal.competencia;

    // Si el área no existe en nuestro objeto de reporte, la creamos.
    if (!reporte[area]) {
      reporte[area] = {
        competencias: {},
        notasArea: []
      };
    }

    // Si la competencia no existe dentro del área, la creamos.
    if (!reporte[area].competencias[competencia]) {
      reporte[area].competencias[competencia] = {
        notas: [],
        promedio: 0
      };
    }

    // Añadimos la nota a la competencia correspondiente.
    reporte[area].competencias[competencia].notas.push({
      fecha: cal.fecha,
      notaNum: cal.calificacionNum,
      retro: cal.retroalimentacion
    });
    reporte[area].notasArea.push(parseFloat(cal.calificacionNum));
  });

  // Ahora, calculamos los promedios
  for (const area in reporte) {
    let sumaPromediosCompetencia = 0;
    let countCompetencias = 0;

    for (const competencia in reporte[area].competencias) {
      const comp = reporte[area].competencias[competencia];
      const sumaNotas = comp.notas.reduce((acc, nota) => acc + parseFloat(nota.notaNum), 0);
      comp.promedio = comp.notas.length > 0 ? (sumaNotas / comp.notas.length).toFixed(2) : 0;
      
      sumaPromediosCompetencia += parseFloat(comp.promedio);
      countCompetencias++;
    }

    reporte[area].promedioArea = countCompetencias > 0 ? (sumaPromediosCompetencia / countCompetencias).toFixed(2) : 0;
  }

  return reporte;
}

// Añade estas funciones a Database.gs o Calculations.gs

/**
 * Obtiene todas las competencias pero ahora incluyendo el "Indicador".
 */
function obtenerTodasCompetenciasConIndicador() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPETENCIAS);
  const data = sheet.getDataRange().getValues();
  const competencias = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][1]) {
      // Usamos la competencia como clave para una búsqueda rápida
      competencias[data[i][1]] = {
        area: data[i][0],
        competencia: data[i][1],
        indicador: data[i][4] || 'Otros' // Columna E para el Indicador
      };
    }
  }
  return competencias;
}

/**
 * NUEVA FUNCIÓN PRINCIPAL para la tabla tipo SIGAN.
 * Organiza las notas de un estudiante por Área, luego por Indicador y finalmente por Competencia.
 */
function obtenerDatosParaReporteSIGAN(email) {
  const calificaciones = obtenerCalificacionesPorEstudiante(email);
  const competenciasMap = obtenerTodasCompetenciasConIndicador();
  const reporte = {};

  // 1. Agrupar calificaciones por Área
  const porArea = calificaciones.reduce((acc, cal) => {
    if (!acc[cal.area]) acc[cal.area] = [];
    acc[cal.area].push(cal);
    return acc;
  }, {});

  // 2. Procesar cada Área
  for (const area in porArea) {
    const calificacionesDeArea = porArea[area];
    const indicadores = {
      'Indicadores de logro 1': {},
      'Indicadores de logro 2': {},
      'Indicadores de logro 3': {},
      'Examen Final': {}
    };

    calificacionesDeArea.forEach(cal => {
      const infoCompetencia = competenciasMap[cal.competencia];
      if (infoCompetencia && indicadores[infoCompetencia.indicador]) {
        // Agrupamos la nota dentro del indicador y competencia correctos
        if (!indicadores[infoCompetencia.indicador][cal.competencia]) {
          indicadores[infoCompetencia.indicador][cal.competencia] = [];
        }
        indicadores[infoCompetencia.indicador][cal.competencia].push(cal.calificacionNum);
      }
    });

    // 3. Calcular promedios
    let notasFinalesArea = [];
    for (const indicador in indicadores) {
      let notasIndicador = [];
      for (const competencia in indicadores[indicador]) {
        const notas = indicadores[indicador][competencia];
        const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
        indicadores[indicador][competencia] = promedio.toFixed(2);
        notasIndicador.push(promedio);
      }
      // Calcular promedio del indicador
      const promedioIndicador = notasIndicador.length > 0 ? (notasIndicador.reduce((a, b) => a + b, 0) / notasIndicador.length) : 0;
      indicadores[indicador].promedio = promedioIndicador.toFixed(2);
      if (promedioIndicador > 0) notasFinalesArea.push(promedioIndicador);
    }
    
    const promedioFinalArea = notasFinalesArea.length > 0 ? (notasFinalesArea.reduce((a, b) => a + b, 0) / notasFinalesArea.length) : 0;

    reporte[area] = {
      indicadores: indicadores,
      promedioFinal: promedioFinalArea.toFixed(2)
    };
  }

  return reporte;
}
