import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, AdminStats } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,  // ← ASEGÚRATE DE QUE ESTÉ EN false
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

  // Estados de carga
  cargando: boolean = true;
  refreshingActivity: boolean = false;
  generatingReport: boolean = false;

  // Timer para actualizaciones automáticas
  private updateTimer: any;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Verificar permisos de admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }

    // Cargar datos iniciales
    this.cargarEstadisticas();

    // Configurar actualización automática cada 5 minutos
    this.updateTimer = setInterval(() => {
      this.cargarEstadisticas(true);
    }, 300000);

    // Escuchar evento de refresh desde admin-layout
    window.addEventListener('adminDataRefresh', this.handleDataRefresh.bind(this));
  }

  ngOnDestroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    window.removeEventListener('adminDataRefresh', this.handleDataRefresh.bind(this));
  }

  // ==================== CARGA DE DATOS ====================

  /**
   * Cargar estadísticas del dashboard
   */
  cargarEstadisticas(silencioso: boolean = false): void {
    if (!silencioso) {
      this.cargando = true;
    }
    
    // Simular carga de datos
    setTimeout(() => {
      try {
        this.stats = this.adminService.getAdminStats();
        this.cargando = false;
        
        if (!silencioso) {
          console.log('Estadísticas cargadas:', this.stats);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        this.toastService.showError('Error al cargar las estadísticas');
        this.cargando = false;
      }
    }, silencioso ? 500 : 1500);
  }

  /**
   * Manejar evento de refresh de datos
   */
  private handleDataRefresh(event: any): void {
    if (event.detail.section === 'Dashboard') {
      this.cargarEstadisticas(true);
    }
  }

  /**
   * Refrescar actividad reciente
   */
  refreshActivity(): void {
    this.refreshingActivity = true;
    
    setTimeout(() => {
      // Recargar solo la actividad reciente
      this.stats.actividadReciente = this.adminService.getAdminStats().actividadReciente;
      this.refreshingActivity = false;
      this.toastService.showSuccess('Actividad actualizada');
    }, 1000);
  }

  // ==================== UTILIDADES DE FECHA Y FORMATO ====================

  /**
   * Obtener fecha actual formateada
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtener hora de última actualización
   */
  getLastUpdateTime(): string {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatear fecha de actividad
   */
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

  /**
   * Obtener clase de color para géneros
   */
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

  // ==================== GENERACIÓN DE REPORTES ====================

  /**
   * Generar reporte de ventas
   */
  generateSalesReport(): void {
    this.generatingReport = true;
    
    setTimeout(() => {
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
      const fechaFin = new Date();
      
      const reporte = this.adminService.getVentasReport(
        fechaInicio.toISOString().split('T')[0],
        fechaFin.toISOString().split('T')[0]
      );
      
      const reporteCompleto = {
        tipo: 'Reporte de Ventas',
        periodo: `${fechaInicio.toLocaleDateString('es-ES')} - ${fechaFin.toLocaleDateString('es-ES')}`,
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        ...reporte,
        ventasDetalladas: this.stats.ventasRecientes
      };
      
      console.log('=== REPORTE DE VENTAS ===');
      console.log(reporteCompleto);
      console.log('========================');
      
      this.generatingReport = false;
      this.toastService.showSuccess('Reporte de ventas generado (ver consola)');
      
      // En una implementación real, aquí se descargaría un archivo
      this.downloadReport(reporteCompleto, 'reporte-ventas');
    }, 2000);
  }

  /**
   * Generar reporte de usuarios
   */
  generateUsersReport(): void {
    this.generatingReport = true;
    
    setTimeout(() => {
      const usuarios = this.adminService.getAllUsers();
      
      const reporteUsuarios = {
        tipo: 'Reporte de Usuarios',
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        totalUsuarios: usuarios.length,
        usuariosActivos: usuarios.filter(u => u.isActive).length,
        usuariosInactivos: usuarios.filter(u => !u.isActive).length,
        adminCount: usuarios.filter(u => u.role === 'admin').length,
        clienteCount: usuarios.filter(u => u.role === 'cliente').length,
        registrosPorMes: this.getRegistrosPorMes(usuarios),
        usuarios: usuarios.map(u => ({
          nombre: u.nombre,
          email: u.email,
          rol: u.role,
          fechaRegistro: u.fechaRegistro,
          activo: u.isActive
        }))
      };
      
      console.log('=== REPORTE DE USUARIOS ===');
      console.log(reporteUsuarios);
      console.log('==========================');
      
      this.generatingReport = false;
      this.toastService.showSuccess('Reporte de usuarios generado (ver consola)');
      
      this.downloadReport(reporteUsuarios, 'reporte-usuarios');
    }, 2000);
  }

  /**
   * Generar reporte de películas
   */
  generateMoviesReport(): void {
    this.generatingReport = true;
    
    setTimeout(() => {
      const reportePeliculas = {
        tipo: 'Reporte de Películas',
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        totalPeliculas: this.stats.totalPeliculas,
        peliculasPopulares: this.stats.peliculasPopulares,
        distribucionGeneros: this.stats.generosMasPopulares,
        ratingPromedio: this.calcularRatingPromedio(),
        peliculasMasRecientes: this.getPeliculasMasRecientes(),
        estadisticasDetalladas: {
          peliculasMejorRating: this.stats.peliculasPopulares.slice(0, 3),
          generosPopulares: this.stats.generosMasPopulares.slice(0, 5)
        }
      };
      
      console.log('=== REPORTE DE PELÍCULAS ===');
      console.log(reportePeliculas);
      console.log('===========================');
      
      this.generatingReport = false;
      this.toastService.showSuccess('Reporte de películas generado (ver consola)');
      
      this.downloadReport(reportePeliculas, 'reporte-peliculas');
    }, 2000);
  }

  /**
   * Generar reporte completo ejecutivo
   */
  generateCompleteReport(): void {
    this.generatingReport = true;
    
    setTimeout(() => {
      const reporteCompleto = {
        tipo: 'Reporte Ejecutivo Completo',
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        periodo: 'Últimos 30 días',
        resumenEjecutivo: {
          totalPeliculas: this.stats.totalPeliculas,
          totalUsuarios: this.stats.totalUsuarios,
          totalVentas: this.stats.totalVentas,
          ingresosMes: this.stats.ingresosMes,
          crecimientoUsuarios: '+15%',
          crecimientoVentas: '+23%'
        },
        metricas: {
          peliculasPopulares: this.stats.peliculasPopulares,
          ventasRecientes: this.stats.ventasRecientes,
          distribucionGeneros: this.stats.generosMasPopulares,
          actividadReciente: this.stats.actividadReciente
        },
        recomendaciones: [
          'Considerar agregar más películas de géneros populares',
          'Implementar programa de fidelización para usuarios activos',
          'Analizar horarios de funciones más exitosos',
          'Desarrollar estrategias de marketing para géneros menos populares'
        ],
        siguientesPasos: [
          'Revisar catálogo de películas mensualmente',
          'Implementar sistema de notificaciones push',
          'Crear dashboard de métricas en tiempo real',
          'Establecer KPIs de crecimiento trimestral'
        ]
      };
      
      console.log('=== REPORTE EJECUTIVO COMPLETO ===');
      console.log(reporteCompleto);
      console.log('=================================');
      
      this.generatingReport = false;
      this.toastService.showSuccess('Reporte ejecutivo generado (ver consola)');
      
      this.downloadReport(reporteCompleto, 'reporte-ejecutivo-completo');
    }, 3000);
  }

  // ==================== ACCIONES RÁPIDAS ====================

  /**
   * Ver logs del sistema
   */
  viewSystemLogs(): void {
    const logs = [
      { fecha: new Date().toISOString(), nivel: 'INFO', mensaje: 'Sistema iniciado correctamente' },
      { fecha: new Date().toISOString(), nivel: 'SUCCESS', mensaje: 'Usuario admin conectado' },
      { fecha: new Date().toISOString(), nivel: 'INFO', mensaje: 'Estadísticas actualizadas' }
    ];
    
    console.log('=== LOGS DEL SISTEMA ===');
    console.log(logs);
    console.log('=======================');
    
    this.toastService.showInfo('Logs del sistema mostrados en consola');
  }

  /**
   * Realizar backup del sistema
   */
  systemBackup(): void {
    const confirmBackup = confirm('¿Estás seguro de que quieres realizar un backup del sistema?');
    
    if (confirmBackup) {
      this.toastService.showInfo('Iniciando backup del sistema...');
      
      setTimeout(() => {
        const backupData = {
          fecha: new Date().toISOString(),
          peliculas: this.stats.totalPeliculas,
          usuarios: this.stats.totalUsuarios,
          version: '1.0.0',
          status: 'completed'
        };
        
        console.log('=== BACKUP SISTEMA ===');
        console.log(backupData);
        console.log('=====================');
        
        this.toastService.showSuccess('Backup completado exitosamente');
      }, 3000);
    }
  }

  /**
   * Ver configuración del sistema
   */
  viewSettings(): void {
    this.router.navigate(['/admin/settings']);
  }

  /**
   * Modo mantenimiento
   */
  systemMaintenance(): void {
    const confirmMaintenance = confirm(
      '¿Estás seguro de que quieres activar el modo mantenimiento?\n\n' +
      'Esto puede afectar la experiencia de los usuarios.'
    );
    
    if (confirmMaintenance) {
      this.toastService.showWarning('Modo mantenimiento activado');
      console.log('Sistema en modo mantenimiento');
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Calcular rating promedio
   */
  private calcularRatingPromedio(): number {
    if (this.stats.peliculasPopulares.length === 0) return 0;
    
    const suma = this.stats.peliculasPopulares.reduce((acc, p) => acc + p.rating, 0);
    return Math.round((suma / this.stats.peliculasPopulares.length) * 10) / 10;
  }

  /**
   * Obtener películas más recientes
   */
  private getPeliculasMasRecientes(): any[] {
    // Simular películas recientes
    return this.stats.peliculasPopulares.slice(0, 3).map(p => ({
      ...p,
      fechaAgregada: new Date().toLocaleDateString('es-ES')
    }));
  }

  /**
   * Obtener registros por mes
   */
  private getRegistrosPorMes(usuarios: any[]): any[] {
    const meses: { [key: string]: number } = {};
    
    usuarios.forEach(user => {
      const fecha = new Date(user.fechaRegistro);
      const mesAño = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      meses[mesAño] = (meses[mesAño] || 0) + 1;
    });
    
    return Object.entries(meses).map(([mes, cantidad]) => ({ mes, cantidad }));
  }

  /**
   * Simular descarga de reporte
   */
  private downloadReport(data: any, filename: string): void {
    // En una implementación real, aquí se generaría y descargaría un archivo
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.toastService.showInfo(`Archivo ${filename} descargado`);
  }

  /**
   * Obtener estadísticas en tiempo real
   */
  getRealTimeStats(): any {
    return {
      usuariosOnline: Math.floor(Math.random() * 50) + 10,
      ventasHoy: Math.floor(Math.random() * 20) + 5,
      ingresosDia: Math.floor(Math.random() * 500) + 100,
      peliculasVistas: Math.floor(Math.random() * 100) + 20
    };
  }

  /**
   * Refrescar todas las estadísticas
   */
  refreshAllStats(): void {
    this.cargarEstadisticas();
    this.toastService.showInfo('Actualizando todas las estadísticas...');
  }

  /**
   * Exportar datos para análisis externo
   */
  exportDataForAnalysis(): void {
    const analyticsData = {
      fecha: new Date().toISOString(),
      stats: this.stats,
      realTimeStats: this.getRealTimeStats(),
      systemInfo: {
        version: '1.0.0',
        uptime: '99.9%',
        lastMaintenance: '2025-05-15'
      }
    };
    
    this.downloadReport(analyticsData, 'analytics-export');
    this.toastService.showSuccess('Datos exportados para análisis');
  }

  /**
   * Configurar alertas del sistema
   */
  setupSystemAlerts(): void {
    const alerts = {
      lowStorage: false,
      highUserActivity: this.stats.usuariosActivos > 50,
      salesTarget: this.stats.ingresosMes > 1000,
      systemHealth: 'good'
    };
    
    console.log('Alertas del sistema:', alerts);
    
    if (alerts.highUserActivity) {
      this.toastService.showInfo('Alta actividad de usuarios detectada');
    }
    
    if (alerts.salesTarget) {
      this.toastService.showSuccess('¡Meta de ventas del mes alcanzada!');
    }
  }

  /**
   * Programar tareas de mantenimiento
   */
  scheduleMaintenanceTasks(): void {
    const tasks = [
      { task: 'Limpiar logs antiguos', scheduled: 'Domingo 02:00', status: 'pending' },
      { task: 'Backup automático', scheduled: 'Diario 03:00', status: 'active' },
      { task: 'Actualizar estadísticas', scheduled: 'Cada hora', status: 'active' },
      { task: 'Verificar integridad de datos', scheduled: 'Lunes 01:00', status: 'pending' }
    ];
    
    console.log('=== TAREAS PROGRAMADAS ===');
    console.log(tasks);
    console.log('=========================');
    
    this.toastService.showInfo('Tareas de mantenimiento programadas (ver consola)');
  }
}