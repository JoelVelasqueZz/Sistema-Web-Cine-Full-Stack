import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, AdminStats } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ReportsService } from '../../../services/reports.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  stats: AdminStats = {
    totalPeliculas: 0,
    totalUsuarios: 0,
    totalVentas: 0,
    ingresosMes: 0,
    usuariosActivos: 0,
    peliculasPopulares: [],
    ventasRecientes: [],
    generosMasPopulares: [],
    actividadReciente: []
  };

  // Estados de carga y error
  cargando: boolean = true;
  refreshingActivity: boolean = false;
  generatingReport: boolean = false;
  errorCargaDatos: boolean = false;
  
  // 🆕 ESTADO DE DATOS Y DIAGNÓSTICO
  datosRealesDisponibles: boolean = false;
  usoFallback: boolean = false;
  ultimaActualizacion: string = '';
  mensajeEstado: string = '';
  tipoError: string = '';

  // Timer para actualizaciones automáticas
  private updateTimer: any;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private reportsService: ReportsService,
    private http: HttpClient
    
  ) { }

  ngOnInit(): void {
    // Verificar permisos de admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }

    // Mostrar mensaje de carga inicial
    this.toastService.showInfo('🔄 Cargando dashboard administrativo...');

    // Cargar datos con diagnóstico
    this.cargarEstadisticasConDiagnostico();

    // Configurar actualización automática cada 5 minutos
    this.updateTimer = setInterval(() => {
      this.cargarEstadisticasConDiagnostico(true);
    }, 300000); // 5 minutos

    // Escuchar evento de refresh desde admin-layout
    window.addEventListener('adminDataRefresh', this.handleDataRefresh.bind(this));
  }
  
  ngOnDestroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    window.removeEventListener('adminDataRefresh', this.handleDataRefresh.bind(this));
  }

  // ==================== CARGA DE DATOS CON DIAGNÓSTICO ====================

  /**
   * 🔍 NUEVO: Cargar estadísticas con diagnóstico inteligente
   */
  cargarEstadisticasConDiagnostico(silencioso: boolean = false): void {
    if (!silencioso) {
      this.cargando = true;
      this.errorCargaDatos = false;
      this.mensajeEstado = 'Conectando con la base de datos...';
    }
    
    console.log('📊 Iniciando carga de estadísticas con diagnóstico...');
    
    this.adminService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cargando = false;
        this.errorCargaDatos = false;
        this.ultimaActualizacion = new Date().toLocaleTimeString('es-ES');
        
        // Determinar tipo de datos
        if (stats.totalUsuarios > 0 || stats.totalPeliculas > 0) {
          this.datosRealesDisponibles = true;
          this.usoFallback = false;
          this.mensajeEstado = 'Datos cargados exitosamente';
          this.tipoError = '';
          
          if (!silencioso) {
            this.toastService.showSuccess('✅ Dashboard cargado con datos disponibles');
          }
        } else {
          this.datosRealesDisponibles = false;
          this.usoFallback = true;
          this.mensajeEstado = 'Dashboard cargado - Sin datos en el sistema';
          
          if (!silencioso) {
            this.toastService.showWarning('⚠️ Dashboard cargado pero sin datos en el sistema');
          }
        }
        
        if (!silencioso) {
          console.log('✅ Estadísticas cargadas:', {
            peliculas: this.stats.totalPeliculas,
            usuarios: this.stats.totalUsuarios,
            ventas: this.stats.totalVentas,
            fuente: this.datosRealesDisponibles ? 'BD/Servicios' : 'Vacío'
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error);
        this.cargando = false;
        this.errorCargaDatos = true;
        this.datosRealesDisponibles = false;
        this.usoFallback = true;
        
        // Diagnosticar tipo de error
        if (error.status === 0) {
          this.tipoError = 'CONEXION';
          this.mensajeEstado = 'Error de conexión - Backend no disponible';
          this.toastService.showError('❌ Backend no disponible en localhost:3000');
          this.mostrarSolucionesBackend();
        } else if (error.status === 404) {
          this.tipoError = 'RUTA';
          this.mensajeEstado = 'Error 404 - Ruta API no encontrada';
          this.toastService.showError('❌ Ruta /api/admin/stats no encontrada');
        } else {
          this.tipoError = 'DESCONOCIDO';
          this.mensajeEstado = `Error ${error.status || 'desconocido'}`;
          this.toastService.showError(`❌ Error: ${error.message}`);
        }
      }
    });
  }

  /**
   * 🔍 NUEVO: Mostrar soluciones para problemas de backend
   */
  private mostrarSolucionesBackend(): void {
    setTimeout(() => {
      this.toastService.showInfo(`
        💡 Soluciones posibles:
        1. Verificar que el backend esté ejecutándose: cd backend && npm start
        2. Comprobar que PostgreSQL esté activo
        3. Revisar la URL de la API: http://localhost:3000
      `);
    }, 2000);
  }

  /**
   * 🔍 NUEVO: Obtener estadísticas del bar con diagnóstico
   */
  getBarStats(): any {
    const barStats = this.adminService.getBarStats();
    
    // Validar que existan datos
    if (!barStats || barStats.totalProductos === 0) {
      return {
        totalProductos: 0,
        productosDisponibles: 0,
        combosEspeciales: 0,
        categorias: 0,
        precioPromedio: 0,
        productoMasPopular: 'Sin productos registrados',
        ventasSimuladas: 0,
        ingresoSimulado: 0,
        datosReales: false,
        mensaje: 'No hay productos en el bar'
      };
    }

    const ventasReales = barStats.ventasSimuladasBar || [];
    const productosPopulares = barStats.productosPopularesBar || [];
    
    return {
      totalProductos: barStats.totalProductos,
      productosDisponibles: barStats.productosDisponibles,
      combosEspeciales: barStats.totalCombos,
      categorias: barStats.totalCategorias,
      precioPromedio: barStats.precioPromedio,
      productoMasPopular: productosPopulares[0]?.nombre || 'Sin datos de ventas',
      ventasSimuladas: ventasReales.length,
      ingresoSimulado: ventasReales.reduce((sum, v) => sum + v.total, 0),
      datosReales: barStats.totalProductos > 0,
      mensaje: barStats.totalProductos > 0 ? 'Datos del bar disponibles' : 'Sin productos'
    };
  }

  /**
   * 🔍 NUEVO: Obtener productos más vendidos con validación
   */
  getTopBarProducts(): any[] {
    const barStats = this.adminService.getBarStats();
    
    if (!barStats.productosPopularesBar || barStats.productosPopularesBar.length === 0) {
      return [{
        ranking: 1,
        nombre: 'Sin productos registrados',
        categoria: 'N/A',
        ventas: 0,
        ingresos: 0,
        esCombo: false,
        datosReales: false,
        mensaje: 'No hay productos en el bar'
      }];
    }
    
    return barStats.productosPopularesBar.slice(0, 5).map((prod, index) => ({
      ranking: index + 1,
      nombre: prod.nombre,
      categoria: prod.categoria,
      ventas: prod.ventasSimuladas,
      ingresos: prod.ingresoSimulado,
      esCombo: prod.esCombo,
      datosReales: true
    }));
  }

  /**
   * 🔍 NUEVO: Obtener actividad reciente del bar con validación
   */
  getBarActivity(): any[] {
    const barStats = this.adminService.getBarStats();
    const ventasReales = barStats.ventasSimuladasBar || [];
    
    if (ventasReales.length === 0) {
      return [{
        tipo: 'sin_ventas',
        descripcion: 'No hay ventas del bar registradas',
        fecha: new Date().toISOString(),
        icono: 'fas fa-info-circle',
        color: 'secondary',
        monto: 0,
        datosReales: false
      }];
    }
    
    return ventasReales.slice(0, 5).map(venta => ({
      tipo: 'venta_bar',
      descripcion: `${venta.cliente} compró ${venta.cantidad}x ${venta.producto}`,
      fecha: venta.fecha,
      icono: venta.esCombo ? 'fas fa-gift' : 'fas fa-utensils',
      color: venta.esCombo ? 'danger' : 'warning',
      monto: venta.total,
      datosReales: true
    }));
  }

  /**
   * 🔍 NUEVO: Obtener tendencias del bar con validación
   */
  getTendenciasBar(): any {
    const barStats = this.adminService.getBarStats();
    const tendencias = barStats.tendenciasBar;
    
    if (!tendencias) {
      return {
        ventasUltimos7Dias: 0,
        ingresoUltimos7Dias: 0,
        ventasUltimos30Dias: 0,
        ingresoUltimos30Dias: 0,
        productoMasVendido: 'Sin datos',
        categoriaMasPopular: 'Sin datos',
        promedioVentaDiaria: 0,
        promedioIngresoDiario: 0,
        datosReales: false
      };
    }
    
    return {
      ...tendencias,
      datosReales: true
    };
  }

  /**
   * 🔍 NUEVO: Ir a gestión del bar
   */
  irAGestionBar(): void {
    this.router.navigate(['/admin/bar']);
  }

  /**
   * 🔍 NUEVO: Obtener actividad reciente combinada con validación
   */
  getActividadRecienteCombinada(): any[] {
    // Usar actividad real del AdminService
    const actividadReal = this.stats.actividadReciente || [];
    
    // Complementar con actividad del bar si existe
    const actividadBar = this.getBarActivity().filter(act => act.datosReales !== false);
    
    // Combinar y ordenar por fecha
    const actividadCombinada = [...actividadReal, ...actividadBar]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 8);
    
    if (actividadCombinada.length === 0) {
      return [{
        tipo: 'sin_actividad',
        descripcion: 'No hay actividad reciente registrada',
        fecha: new Date().toISOString(),
        icono: 'fas fa-info-circle',
        color: 'secondary',
        datosReales: false
      }];
    }
    
    console.log('📊 Actividad reciente combinada:', actividadCombinada.length, 'items');
    return actividadCombinada;
  }

  /**
   * Manejar evento de refresh de datos
   */
  private handleDataRefresh(event: any): void {
    if (event.detail.section === 'Dashboard') {
      this.cargarEstadisticasConDiagnostico(true);
    }
  }

  /**
   * 🔍 ACTUALIZADO: Refrescar actividad reciente
   */
  refreshActivity(): void {
    this.refreshingActivity = true;
    
    this.adminService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats.actividadReciente = stats.actividadReciente;
        this.refreshingActivity = false;
        this.toastService.showSuccess('🔄 Actividad actualizada');
      },
      error: (error) => {
        console.error('❌ Error al refrescar actividad:', error);
        this.refreshingActivity = false;
        this.toastService.showError('❌ Error al actualizar actividad');
      }
    });
  }

  // ==================== DIAGNÓSTICO Y SOLUCIONES ====================

  /**
   * 🔍 NUEVO: Verificar estado de la conexión
   */
  verificarEstadoConexion(): void {
    this.toastService.showInfo('🔍 Verificando conexión con el backend...');
    
    this.adminService.checkDatabaseConnection().subscribe({
      next: (connected) => {
        if (connected) {
          this.toastService.showSuccess('✅ Conexión con backend exitosa');
          this.datosRealesDisponibles = true;
          this.errorCargaDatos = false;
          // Recargar datos
          this.cargarEstadisticasConDiagnostico();
        } else {
          this.toastService.showWarning('⚠️ Backend no responde correctamente');
          this.mostrarInstruccionesBackend();
        }
      },
      error: () => {
        this.toastService.showError('❌ No se puede conectar con el backend');
        this.mostrarInstruccionesBackend();
      }
    });
  }

  /**
   * 🔍 NUEVO: Mostrar instrucciones para el backend
   */
  private mostrarInstruccionesBackend(): void {
    console.log('🛠️ INSTRUCCIONES PARA SOLUCIONAR:');
    console.log('1. Abrir terminal en la carpeta del backend');
    console.log('2. Ejecutar: npm install');
    console.log('3. Ejecutar: npm start');
    console.log('4. Verificar que PostgreSQL esté ejecutándose');
    console.log('5. Comprobar que el backend responda en http://localhost:3000');
    
    setTimeout(() => {
      this.toastService.showInfo(`
        🛠️ Para solucionar:
        1. Abrir terminal en carpeta backend
        2. Ejecutar: npm start
        3. Verificar PostgreSQL activo
        4. Comprobar http://localhost:3000
      `);
    }, 1000);
  }

  /**
   * 🔍 NUEVO: Reintentar carga de datos
   */
  reintentarCarga(): void {
    this.toastService.showInfo('🔄 Reintentando cargar datos...');
    this.cargarEstadisticasConDiagnostico();
  }

  /**
   * 🔍 NUEVO: Verificar estado de datos
   */
  verificarEstadoDatos(): void {
    this.toastService.showInfo('🔍 Verificando estado del sistema...');
    
    this.adminService.getDataStatus().subscribe({
      next: (status) => {
        console.log('📊 Estado del sistema:', status);
        
        const mensaje = `
          📊 Estado del Sistema:
          • Películas: ${status.totalPeliculas}
          • Usuarios: ${status.totalUsuarios}
          • Ventas: ${status.totalVentas}
          • Fuente: ${status.source}
          • Última actualización: ${new Date(status.lastUpdate).toLocaleTimeString()}
        `;
        
        this.toastService.showInfo(mensaje);
      },
      error: (error) => {
        console.error('❌ Error verificando estado:', error);
        this.toastService.showError('❌ Error al verificar estado del sistema');
      }
    });
  }

  /**
   * 🔍 NUEVO: Mostrar información completa del sistema
   */
  mostrarInfoCompleta(): void {
    const info = {
      estado: {
        datosReales: this.datosRealesDisponibles,
        usoFallback: this.usoFallback,
        errorCarga: this.errorCargaDatos,
        tipoError: this.tipoError,
        mensaje: this.mensajeEstado
      },
      estadisticas: {
        peliculas: this.stats.totalPeliculas,
        usuarios: this.stats.totalUsuarios,
        ventas: this.stats.totalVentas,
        ingresos: this.stats.ingresosMes
      },
      bar: this.getBarStats(),
      ultimaActualizacion: this.ultimaActualizacion,
      timestamp: new Date().toLocaleString('es-ES')
    };
    
    console.log('=== INFORMACIÓN COMPLETA DEL SISTEMA ===');
    console.table(info.estado);
    console.table(info.estadisticas);
    console.log('Bar:', info.bar);
    console.log('========================================');
    
    this.toastService.showSuccess('ℹ️ Información del sistema mostrada en consola del navegador');
  }

  // ==================== UTILIDADES DE FECHA Y FORMATO ====================

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getLastUpdateTime(): string {
    return this.ultimaActualizacion || new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatActivityDate(fecha: string): string {
    const fechaObj = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Hace un momento';
    } else if (diffMins < 60) {
      return `Hace ${diffMins} minutos`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return fechaObj.toLocaleDateString('es-ES');
    }
  }

  getGenreColorClass(genero: string): string {
    const colorMap: { [key: string]: string } = {
      'Acción': 'bg-danger',
      'Aventura': 'bg-warning',
      'Comedia': 'bg-success',
      'Drama': 'bg-primary',
      'Terror': 'bg-dark',
      'Romance': 'bg-info',
      'Ciencia Ficción': 'bg-secondary',
      'Fantasía': 'bg-purple',
      'Animación': 'bg-orange',
      'Misterio': 'bg-indigo'
    };
    
    return colorMap[genero] || 'bg-primary';
  }

  // ==================== REPORTES SIMPLIFICADOS ====================

  generateSalesReport(): void {
  this.generatingReport = true;
  this.toastService.showInfo('📊 Generando reporte de ventas en PDF...');
  
  this.downloadReportPDF('ventas', 'Reporte de Ventas');
}

generateBarReport(): void {
  this.generatingReport = true;
  this.toastService.showInfo('📊 Generando reporte del bar en PDF...');
  
  this.downloadReportPDF('bar', 'Reporte del Bar');
}

generateUsersReport(): void {
  this.generatingReport = true;
  this.toastService.showInfo('📊 Generando reporte de usuarios en PDF...');
  
  this.downloadReportPDF('usuarios', 'Reporte de Usuarios');
}

generateMoviesReport(): void {
  this.generatingReport = true;
  this.toastService.showInfo('📊 Generando reporte de películas en PDF...');
  
  this.downloadReportPDF('peliculas', 'Reporte de Películas');
}

generateCombinedReport(): void {
  this.generatingReport = true;
  this.toastService.showInfo('📊 Generando reporte combinado en PDF...');
  
  this.downloadReportPDF('combinado', 'Reporte Combinado');
}

generateCompleteReport(): void {
  this.generatingReport = true;
  this.toastService.showInfo('📊 Generando reporte ejecutivo en PDF...');
  
  this.downloadReportPDF('ejecutivo', 'Reporte Ejecutivo');
}
private downloadReportPDF(tipoReporte: string, nombreReporte: string): void {
  const token = this.authService.getToken();
  
  if (!token) {
    this.generatingReport = false;
    this.toastService.showError('❌ No hay token de autenticación');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

 const url = `${environment.apiUrl}/reports/${tipoReporte}?formato=pdf`;

  // Usar HttpClient para descargar con headers de autenticación
  this.http.get(url, { 
    headers, 
    responseType: 'blob' as 'json',
    observe: 'response'
  }).subscribe({
    next: (response: any) => {
      // Crear blob y descargar archivo
      const blob = new Blob([response.body], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Crear link para descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${tipoReporte}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      window.URL.revokeObjectURL(downloadUrl);
      
      this.generatingReport = false;
      this.toastService.showSuccess(`✅ ${nombreReporte} descargado exitosamente`);
    },
    error: (error) => {
      console.error(`❌ Error descargando ${nombreReporte}:`, error);
      this.generatingReport = false;
      
      if (error.status === 401) {
        this.toastService.showError('❌ No tienes permisos para generar reportes');
        this.router.navigate(['/login']);
      } else if (error.status === 0) {
        this.toastService.showError('❌ Backend no disponible. Verifica que esté ejecutándose.');
      } else {
        this.toastService.showError(`❌ Error al generar ${nombreReporte}`);
      }
    }
  });
}


  // ==================== ACCIONES RÁPIDAS MEJORADAS ====================

  viewSystemLogs(): void {
    const logs = [
      { fecha: new Date().toISOString(), nivel: 'INFO', mensaje: `Sistema iniciado - Estado: ${this.mensajeEstado}` },
      { fecha: new Date().toISOString(), nivel: this.errorCargaDatos ? 'ERROR' : 'SUCCESS', mensaje: `Carga de datos: ${this.errorCargaDatos ? 'Fallida' : 'Exitosa'}` },
      { fecha: new Date().toISOString(), nivel: 'INFO', mensaje: `Datos reales: ${this.datosRealesDisponibles ? 'Disponibles' : 'No disponibles'}` },
      { fecha: new Date().toISOString(), nivel: 'INFO', mensaje: `Fallback activo: ${this.usoFallback ? 'Sí' : 'No'}` },
      { fecha: new Date().toISOString(), nivel: 'INFO', mensaje: `Películas: ${this.stats.totalPeliculas}, Usuarios: ${this.stats.totalUsuarios}` }
    ];
    
    console.log('=== LOGS DEL SISTEMA CON DIAGNÓSTICO ===');
    console.table(logs);
    console.log('========================================');
    
    this.toastService.showInfo('📋 Logs del sistema mostrados en consola del navegador');
  }

  systemBackup(): void {
  const confirmBackup = confirm(
    '¿Realizar backup del sistema en PDF?\n\n' +
    `Estado actual:\n` +
    `• Películas: ${this.stats.totalPeliculas}\n` +
    `• Usuarios: ${this.stats.totalUsuarios}\n` +
    `• Ventas: ${this.stats.totalVentas}\n` +
    `• Productos Bar: ${this.getBarStats().totalProductos}\n` +
    `• Fuente: ${this.datosRealesDisponibles ? 'Datos disponibles' : 'Sistema vacío'}`
  );
  
  if (confirmBackup) {
    this.toastService.showInfo('💾 Generando backup del sistema en PDF...');
    
    setTimeout(() => {
      try {
        this.generateSystemBackupPDF();
        this.toastService.showSuccess('✅ Backup completado y descargado en PDF');
      } catch (error) {
        console.error('Error generando backup PDF:', error);
        this.toastService.showError('❌ Error al generar backup PDF');
      }
    }, 1000);
  }
}
private generateSystemBackupPDF(): void {
  const doc = new jsPDF();
  const fechaBackup = new Date().toLocaleDateString('es-ES');
  const horaBackup = new Date().toLocaleTimeString('es-ES');
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // ==================== HEADER ====================
  // Fondo del header
  doc.setFillColor(52, 73, 94);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Título principal
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('BACKUP DEL SISTEMA PARKYFILMS', pageWidth / 2, 25, { align: 'center' });
  
  // Subtítulo
  doc.setFontSize(14);
  doc.text('Copia de Seguridad Completa del Sistema', pageWidth / 2, 35, { align: 'center' });
  
  // Información de fecha y hora
  doc.setFontSize(12);
  doc.text(`Generado el: ${fechaBackup} a las ${horaBackup}`, pageWidth / 2, 45, { align: 'center' });
  
  yPosition = 65;

  // ==================== INFORMACIÓN GENERAL ====================
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN GENERAL DEL SISTEMA', margin, yPosition);
  yPosition += 15;

  // Tabla de información general
  const infoGeneral = [
    ['Fecha del Backup', `${fechaBackup} ${horaBackup}`],
    ['Versión del Sistema', '2.1.0'],
    ['Estado de Datos', this.datosRealesDisponibles ? 'Datos Reales Disponibles' : 'Datos Locales'],
    ['Modo de Operación', this.usoFallback ? 'Modo Fallback' : 'Modo Normal'],
    ['Estado de Conexión', this.errorCargaDatos ? 'Error de Conexión' : 'Conexión OK'],
    ['Última Actualización', this.ultimaActualizacion || 'No disponible'],
    ['Usuario Admin', this.authService.getCurrentUser()?.nombre || 'Administrador'],
    ['Mensaje de Estado', this.mensajeEstado || 'Sistema normal']
  ];

  autoTable(doc, {
    head: [['Parámetro', 'Valor']],
    body: infoGeneral,
    startY: yPosition,
    theme: 'striped',
    headStyles: { 
      fillColor: [52, 73, 94],
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 10,
      cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 110 }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // ==================== ESTADÍSTICAS PRINCIPALES ====================
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADÍSTICAS PRINCIPALES', margin, yPosition);
  yPosition += 15;

  const estadisticasPrincipales = [
    ['Total de Películas', this.stats.totalPeliculas.toString()],
    ['Total de Usuarios', this.stats.totalUsuarios.toString()],
    ['Usuarios Activos', this.stats.usuariosActivos.toString()],
    ['Total de Ventas', this.stats.totalVentas.toString()],
    ['Ingresos del Mes', `$${this.stats.ingresosMes.toFixed(2)}`],
    ['Ticket Promedio', `$${(this.stats.ticketPromedio || 0).toFixed(2)}`],
    ['Órdenes Completadas', (this.stats.ordenesCompletadas || 0).toString()]
  ];

  autoTable(doc, {
    head: [['Métrica', 'Valor']],
    body: estadisticasPrincipales,
    startY: yPosition,
    theme: 'grid',
    headStyles: { 
      fillColor: [46, 125, 50],
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 10,
      cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 90, halign: 'center' }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // ==================== ESTADÍSTICAS DEL BAR ====================
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADÍSTICAS DEL BAR', margin, yPosition);
  yPosition += 15;

  const barStats = this.getBarStats();
  const estadisticasBar = [
    ['Total Productos', barStats.totalProductos.toString()],
    ['Productos Disponibles', barStats.productosDisponibles.toString()],
    ['Combos Especiales', barStats.combosEspeciales.toString()],
    ['Categorías', barStats.categorias.toString()],
    ['Precio Promedio', `$${barStats.precioPromedio.toFixed(2)}`],
    ['Producto Más Popular', barStats.productoMasPopular],
    ['Ventas Simuladas', barStats.ventasSimuladas.toString()],
    ['Ingreso Simulado', `$${barStats.ingresoSimulado.toFixed(2)}`],
    ['Estado de Datos', barStats.datosReales ? 'Datos Reales' : 'Sin Productos']
  ];

  autoTable(doc, {
    head: [['Métrica del Bar', 'Valor']],
    body: estadisticasBar,
    startY: yPosition,
    theme: 'striped',
    headStyles: { 
      fillColor: [255, 193, 7],
      textColor: [0, 0, 0],
      fontSize: 12,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 10,
      cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 90 }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // ==================== PELÍCULAS POPULARES ====================
  if (this.stats.peliculasPopulares && this.stats.peliculasPopulares.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PELÍCULAS MÁS POPULARES', margin, yPosition);
    yPosition += 15;

    const peliculasData = this.stats.peliculasPopulares.slice(0, 10).map((pelicula, index) => [
      (index + 1).toString(),
      pelicula.titulo.length > 30 ? pelicula.titulo.substring(0, 30) + '...' : pelicula.titulo,
      pelicula.genero,
      pelicula.rating.toFixed(1),
      pelicula.vistas.toString()
    ]);

    autoTable(doc, {
      head: [['#', 'Título', 'Género', 'Rating', 'Vistas']],
      body: peliculasData,
      startY: yPosition,
      theme: 'grid',
      headStyles: { 
        fillColor: [33, 150, 243],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 }
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // ==================== GÉNEROS MÁS POPULARES ====================
  if (this.stats.generosMasPopulares && this.stats.generosMasPopulares.length > 0) {
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUCIÓN POR GÉNEROS', margin, yPosition);
    yPosition += 15;

    const generosData = this.stats.generosMasPopulares.map((genero, index) => [
      (index + 1).toString(),
      genero.genero,
      genero.cantidad.toString(),
      `${genero.porcentaje.toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [['#', 'Género', 'Cantidad', 'Porcentaje']],
      body: generosData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { 
        fillColor: [156, 39, 176],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 }
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // ==================== ACTIVIDAD RECIENTE ====================
  const actividadReciente = this.getActividadRecienteCombinada().filter(act => act.tipo !== 'sin_actividad');
  
  if (actividadReciente.length > 0) {
    if (yPosition > 180) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVIDAD RECIENTE DEL SISTEMA', margin, yPosition);
    yPosition += 15;

    const actividadData = actividadReciente.slice(0, 8).map(actividad => [
      actividad.tipo.replace('_', ' ').toUpperCase(),
      actividad.descripcion.length > 50 ? actividad.descripcion.substring(0, 50) + '...' : actividad.descripcion,
      this.formatActivityDate(actividad.fecha),
      actividad.monto ? `$${actividad.monto.toFixed(2)}` : 'N/A'
    ]);

    autoTable(doc, {
      head: [['Tipo', 'Descripción', 'Fecha', 'Monto']],
      body: actividadData,
      startY: yPosition,
      theme: 'grid',
      headStyles: { 
        fillColor: [76, 175, 80],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 8,
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 }
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 80 },
        2: { cellWidth: 40 },
        3: { cellWidth: 25, halign: 'center' }
      }
    });
  }

  // ==================== FOOTER ====================
  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Línea del footer
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(1);
    doc.line(margin, doc.internal.pageSize.height - 20, pageWidth - margin, doc.internal.pageSize.height - 20);
    
    // Información del footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`ParkyFilms - Backup del Sistema`, margin, doc.internal.pageSize.height - 12);
    doc.text('Documento Confidencial - Solo uso interno', margin, doc.internal.pageSize.height - 8);
    
    // Número de página
    doc.setTextColor(52, 73, 94);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 30, doc.internal.pageSize.height - 12);
    doc.text(`${fechaBackup} ${horaBackup}`, pageWidth - margin - 30, doc.internal.pageSize.height - 8);
  }

  // ==================== GUARDAR PDF ====================
  const fileName = `backup-sistema-parkyfilms-${new Date().toISOString().split('T')[0]}-${new Date().toTimeString().split(' ')[0].replace(/:/g, '')}.pdf`;
  doc.save(fileName);
}

  refreshAllStats(): void {
    this.toastService.showInfo('🔄 Actualizando todas las estadísticas...');
    this.cargarEstadisticasConDiagnostico();
  }
}