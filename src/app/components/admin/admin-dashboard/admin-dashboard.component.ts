import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, AdminStats } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { BarService } from '../../../services/bar.service';

// Importar jsPDF correctamente para Angular
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
    private router: Router,
    private barService: BarService
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
  getBarStats(): any {
  const barStats = this.adminService.getBarStats();
  return {
    totalProductos: barStats.totalProductos,
    productosDisponibles: barStats.productosDisponibles,
    combosEspeciales: barStats.totalCombos,
    categorias: barStats.totalCategorias,
    precioPromedio: barStats.precioPromedio,
    productoMasPopular: barStats.productosPopularesBar[0]?.nombre || 'N/A',
    ventasSimuladas: barStats.ventasSimuladasBar.length,
    ingresoSimulado: barStats.ventasSimuladasBar.reduce((sum, v) => sum + v.total, 0)
  };
}

/**
 * Generar reporte rápido del bar
 */
generateBarReport(): void {
  this.generatingReport = true;
  this.toastService.showInfo('Generando reporte del bar...');
  
  setTimeout(() => {
    try {
      // Usar el método del AdminService que ya existe
      this.adminService.generateBarReport();
      this.generatingReport = false;
      // No mostrar toast aquí porque ya lo hace el adminService
    } catch (error) {
      console.error('Error generando reporte del bar:', error);
      this.generatingReport = false;
      this.toastService.showError('Error al generar el reporte del bar');
    }
  }, 1000);
}

/**
 * Obtener productos más vendidos del bar para mostrar en dashboard
 */
getTopBarProducts(): any[] {
  const barStats = this.adminService.getBarStats();
  return barStats.productosPopularesBar.slice(0, 5).map((prod, index) => ({
    ranking: index + 1,
    nombre: prod.nombre,
    categoria: prod.categoria,
    ventas: prod.ventasSimuladas,
    ingresos: prod.ingresoSimulado,
    esCombo: prod.esCombo
  }));
}

/**
 * Obtener actividad reciente del bar
 */
getBarActivity(): any[] {
  const barStats = this.adminService.getBarStats();
  return barStats.ventasSimuladasBar.slice(0, 5).map(venta => ({
    tipo: 'venta_bar',
    descripcion: `${venta.cliente} compró ${venta.cantidad}x ${venta.producto}`,
    fecha: venta.fecha,
    icono: venta.esCombo ? 'fas fa-gift' : 'fas fa-utensils',
    color: venta.esCombo ? 'danger' : 'warning',
    monto: venta.total
  }));
}

/**
 * Ir a gestión del bar
 */
irAGestionBar(): void {
  this.router.navigate(['/admin/bar']);
}

/**
 * Actualizar método de actividad reciente para incluir bar
 */
getActividadRecienteCombinada(): any[] {
  const actividadExistente = this.stats.actividadReciente;
  const actividadBar = this.getBarActivity();
  
  // Combinar y ordenar por fecha
  const actividadCombinada = [...actividadExistente, ...actividadBar]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 8);
  
  return actividadCombinada;
}
  // ==================== CARGA DE DATOS ====================

  /**
   * Cargar estadísticas del dashboard
   */
  cargarEstadisticas(silencioso: boolean = false): void {
    if (!silencioso) {
      this.cargando = true;
    }
    
    try {
      // Usar el servicio real directamente
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

  // ==================== UTILIDADES PARA PDF ====================

  /**
   * Configurar encabezado del PDF con logo mejorado
   */
  private setupPDFHeader(doc: jsPDF, titulo: string, subtitulo?: string): void {
    // Fondo del encabezado
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Logo y título principal en blanco
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('ParkyFilms', 20, 25);
    
    doc.setFontSize(12);
    doc.text('Panel de Administracion', 20, 35);
    
    // Título del reporte
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(titulo, 20, 60);
    
    if (subtitulo) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitulo, 20, 72);
    }
    
    // Información de generación
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const fechaGeneracion = new Date().toLocaleString('es-ES');
    doc.text(`Generado el: ${fechaGeneracion}`, 20, 85);
    doc.text(`Por: ${this.authService.getCurrentUser()?.nombre || 'Admin'}`, 20, 95);
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, 100, 190, 100);
  }

  /**
   * Configurar pie de página mejorado
   */
  private setupPDFFooter(doc: jsPDF): void {
    const pageCount = (doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Línea superior del pie
      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(1);
      doc.line(20, 275, 190, 275);
      
      // Información del pie
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('ParkyFilms - Sistema de Gestión Integral', 20, 282);
      doc.text('Reporte Confidencial - Solo para uso interno', 20, 287);
      
      // Página actual
      doc.setTextColor(41, 128, 185);
      doc.text(`Página ${i} de ${pageCount}`, 150, 282);
      
      // Timestamp
      const timestamp = new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      doc.text(`Hora: ${timestamp}`, 150, 287);
    }
  }

  /**
   * Agregar resumen ejecutivo mejorado
   */
  private addExecutiveSummary(doc: jsPDF, startY: number): number {
    let currentY = startY;
    
    // Título de sección con fondo
    doc.setFillColor(240, 240, 240);
    doc.rect(20, currentY - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(52, 73, 94);
    doc.text('RESUMEN EJECUTIVO', 25, currentY + 5);
    currentY += 20;
    
    // Métricas principales en cajas mejoradas
    const metrics = [
      { 
        label: 'Total Peliculas', 
        value: this.stats.totalPeliculas.toString(), 
        color: [52, 152, 219]
      },
      { 
        label: 'Total Usuarios', 
        value: this.stats.totalUsuarios.toString(), 
        color: [46, 204, 113]
      },
      { 
        label: 'Ventas Totales', 
        value: this.stats.totalVentas.toString(), 
        color: [155, 89, 182]
      },
      { 
        label: 'Ingresos del Mes', 
        value: `${this.stats.ingresosMes.toFixed(2)}`, 
        color: [230, 126, 34]
      }
    ];
    
    const boxWidth = 42;
    const boxHeight = 30;
    let xPosition = 20;
    
    metrics.forEach((metric, index) => {
      if (index > 0 && index % 2 === 0) {
        currentY += 45;
        xPosition = 20;
      } else if (index > 0) {
        xPosition += boxWidth + 8;
      }
      
      // Caja con sombra
      doc.setFillColor(240, 240, 240);
      doc.rect(xPosition + 2, currentY + 2, boxWidth, boxHeight, 'F');
      
      // Caja principal
      doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
      doc.rect(xPosition, currentY, boxWidth, boxHeight, 'F');
      
      // Borde
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(2);
      doc.rect(xPosition, currentY, boxWidth, boxHeight, 'S');
      
      // Valor
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(metric.value, xPosition + 5, currentY + 15);
      
      // Etiqueta
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(metric.label, xPosition, currentY + boxHeight + 8);
      
      if (index === 1) xPosition = 110;
    });
    
    return currentY + 55;
  }

  /**
   * Agregar gráfico simple de barras para géneros
   */
  private addGenreChart(doc: jsPDF, startY: number): number {
    const generos = this.stats.generosMasPopulares.slice(0, 5);
    if (generos.length === 0) return startY;
    
    let currentY = startY;
    
    // Título
    doc.setFillColor(240, 240, 240);
    doc.rect(20, currentY - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(52, 73, 94);
    doc.text('DISTRIBUCION POR GENEROS', 25, currentY + 5);
    currentY += 25;
    
    const maxPorcentaje = Math.max(...generos.map(g => g.porcentaje));
    const chartWidth = 120;
    
    generos.forEach((genero, index) => {
      const barWidth = (genero.porcentaje / maxPorcentaje) * chartWidth;
      const barHeight = 8;
      const yPos = currentY + (index * 15);
      
      // Barra de fondo
      doc.setFillColor(230, 230, 230);
      doc.rect(70, yPos, chartWidth, barHeight, 'F');
      
      // Barra de datos
      const colors = [
        [231, 76, 60], [52, 152, 219], [46, 204, 113], 
        [155, 89, 182], [230, 126, 34]
      ];
      const color = colors[index % colors.length];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(70, yPos, barWidth, barHeight, 'F');
      
      // Etiquetas
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(genero.genero, 25, yPos + 6);
      doc.text(`${genero.porcentaje}%`, chartWidth + 75, yPos + 6);
    });
    
    return currentY + (generos.length * 15) + 10;
  }

  // ==================== GENERACIÓN DE REPORTES PDF MEJORADOS ====================

  /**
   * Generar reporte de ventas mejorado
   */
  generateSalesReport(): void {
    this.generatingReport = true;
    this.toastService.showInfo('Generando reporte de ventas...');
    
    try {
      const doc = new jsPDF();
      
      // Configurar encabezado
      this.setupPDFHeader(doc, 'REPORTE DE VENTAS', 'Análisis detallado de ingresos y transacciones');
      
      let currentY = 110;
      
      // Agregar resumen ejecutivo
      currentY = this.addExecutiveSummary(doc, currentY);
      
      // Métricas adicionales de ventas
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('ANALISIS DE VENTAS', 25, currentY + 5);
      currentY += 20;
      
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
      const fechaFin = new Date();
      
      const reporteVentas = this.adminService.getVentasReport(
        fechaInicio.toISOString().split('T')[0],
        fechaFin.toISOString().split('T')[0]
      );
      
      // Métricas de ventas
      const ventasMetrics = [
        ['Entradas Vendidas', reporteVentas.entradasVendidas.toString()],
        ['Ingreso Total', `$${reporteVentas.ingresoTotal.toFixed(2)}`],
        ['Promedio por Venta', `$${(reporteVentas.ingresoTotal / Math.max(reporteVentas.totalVentas, 1)).toFixed(2)}`],
        ['Tasa de Conversión', '78.5%']
      ];
      
      autoTable(doc, {
        body: ventasMetrics,
        startY: currentY,
        theme: 'plain',
        styles: { 
          fontSize: 11,
          cellPadding: { top: 5, right: 10, bottom: 5, left: 10 }
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80, fillColor: [248, 249, 250] },
          1: { cellWidth: 60, halign: 'center', fillColor: [255, 255, 255] }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // Ventas recientes con más detalles
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('TRANSACCIONES RECIENTES', 25, currentY + 5);
      currentY += 15;
      
      const ventasData = this.stats.ventasRecientes.map(venta => [
        venta.usuario,
        venta.pelicula.length > 20 ? venta.pelicula.substring(0, 20) + '...' : venta.pelicula,
        venta.entradas.toString(),
        `$${venta.total.toFixed(2)}`,
        this.getEstadoBadge(venta.estado),
        new Date(venta.fecha).toLocaleDateString('es-ES')
      ]);
      
      autoTable(doc, {
        head: [['Usuario', 'Película', 'Entradas', 'Total', 'Estado', 'Fecha']],
        body: ventasData,
        startY: currentY,
        theme: 'striped',
        headStyles: { 
          fillColor: [52, 152, 219],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 25, halign: 'center' }
        },
        alternateRowStyles: { fillColor: [248, 249, 250] }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // Recomendaciones
      this.addRecommendations(doc, currentY, [
        'Implementar descuentos para incentivar compras grupales',
        'Promocionar horarios con menor ocupación',
        'Desarrollar programa de puntos por fidelidad',
        'Analizar patrones de compra para optimizar precios'
      ]);
      
      // Configurar pie de página
      this.setupPDFFooter(doc);
      
      // Descargar PDF
      doc.save(`reporte-ventas-${new Date().toISOString().split('T')[0]}.pdf`);
      
      this.generatingReport = false;
      this.toastService.showSuccess('Reporte de ventas generado exitosamente');
      
    } catch (error) {
      console.error('Error generando reporte de ventas:', error);
      this.generatingReport = false;
      this.toastService.showError('Error al generar el reporte de ventas');
    }
  }

  /**
   * Generar reporte de usuarios mejorado
   */
  generateUsersReport(): void {
    this.generatingReport = true;
    this.toastService.showInfo('Generando reporte de usuarios...');
    
    try {
      const doc = new jsPDF();
      const usuarios = this.adminService.getAllUsers();
      
      // Configurar encabezado
      this.setupPDFHeader(doc, 'REPORTE DE USUARIOS', 'Análisis de la base de usuarios registrados');
      
      let currentY = 110;
      
      // Estadísticas generales mejoradas
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('ESTADISTICAS DE USUARIOS', 25, currentY + 5);
      currentY += 20;
      
      const usuariosActivos = usuarios.filter(u => u.isActive !== false).length;
      const usuariosInactivos = usuarios.filter(u => u.isActive === false).length;
      const adminCount = usuarios.filter(u => u.role === 'admin').length;
      const clienteCount = usuarios.filter(u => u.role === 'cliente').length;
      
      const statsData = [
        ['Total de Usuarios', usuarios.length.toString()],
        ['Usuarios Activos', `${usuariosActivos} (${Math.round((usuariosActivos/usuarios.length)*100)}%)`],
        ['Usuarios Inactivos', `${usuariosInactivos} (${Math.round((usuariosInactivos/usuarios.length)*100)}%)`],
        ['Administradores', `${adminCount} (${Math.round((adminCount/usuarios.length)*100)}%)`],
        ['Clientes', `${clienteCount} (${Math.round((clienteCount/usuarios.length)*100)}%)`],
        ['Tasa de Actividad', `${Math.round((usuariosActivos/usuarios.length)*100)}%`]
      ];
      
      autoTable(doc, {
        body: statsData,
        startY: currentY,
        theme: 'plain',
        styles: { 
          fontSize: 11,
          cellPadding: { top: 5, right: 10, bottom: 5, left: 10 }
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100, fillColor: [248, 249, 250] },
          1: { cellWidth: 70, halign: 'center', fillColor: [255, 255, 255] }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // Lista de usuarios con más información
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('DIRECTORIO DE USUARIOS', 25, currentY + 5);
      currentY += 15;
      
      const usuariosData = usuarios.slice(0, 12).map((usuario, index) => [
        (index + 1).toString(),
        usuario.nombre,
        usuario.email.length > 25 ? usuario.email.substring(0, 25) + '...' : usuario.email,
        usuario.role === 'admin' ? 'Admin' : 'Cliente',
        new Date(usuario.fechaRegistro).toLocaleDateString('es-ES'),
        usuario.isActive !== false ? 'Activo' : 'Inactivo'
      ]);
      
      autoTable(doc, {
        head: [['#', 'Nombre', 'Email', 'Rol', 'Registro', 'Estado']],
        body: usuariosData,
        startY: currentY,
        theme: 'striped',
        headStyles: { 
          fillColor: [46, 204, 113],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: { top: 4, right: 4, bottom: 4, left: 4 }
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 40 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 25, halign: 'center' }
        },
        alternateRowStyles: { fillColor: [248, 249, 250] }
      });
      
      // Nota si hay más usuarios
      if (usuarios.length > 12) {
        currentY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Mostrando los primeros 12 usuarios de ${usuarios.length} totales`, 20, currentY);
        doc.text(`Para ver la lista completa, exportar desde la sección de usuarios`, 20, currentY + 8);
      }
      
      // Configurar pie de página
      this.setupPDFFooter(doc);
      
      // Descargar PDF
      doc.save(`reporte-usuarios-${new Date().toISOString().split('T')[0]}.pdf`);
      
      this.generatingReport = false;
      this.toastService.showSuccess('Reporte de usuarios generado exitosamente');

    } catch (error) {
      console.error('Error generando reporte de usuarios:', error);
      this.generatingReport = false;
      this.toastService.showError('Error al generar el reporte de usuarios');
    }
  }

  /**
   * Generar reporte de películas mejorado
   */
  generateMoviesReport(): void {
    this.generatingReport = true;
    this.toastService.showInfo('Generando reporte de películas...');
    
    try {
      const doc = new jsPDF();
      const peliculas = this.adminService.getAllPeliculas();
      
      // Configurar encabezado
      this.setupPDFHeader(doc, 'REPORTE DE PELÍCULAS', 'Análisis del catálogo cinematográfico');
      
      let currentY = 110;
      
      // Estadísticas del catálogo mejoradas
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('ESTADISTICAS DEL CATALOGO', 25, currentY + 5);
      currentY += 20;
      
      const ratingPromedio = this.calcularRatingPromedio();
      const peliculasEstreno = peliculas.filter(p => {
        const fechaPelicula = new Date(p.fechaEstreno);
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        return fechaPelicula >= hace30Dias;
      }).length;
      
      const catalogoStats = [
        ['Total de Peliculas', this.stats.totalPeliculas.toString()],
        ['Rating Promedio', `${ratingPromedio.toFixed(1)}/10`],
        ['Generos Disponibles', this.stats.generosMasPopulares.length.toString()],
        ['Estrenos Recientes', `${peliculasEstreno} (ultimo mes)`],
        ['Peliculas Populares', `${this.stats.peliculasPopulares.length} destacadas`],
        ['Ocupacion Promedio', '73.8%']
      ];
      
      autoTable(doc, {
        body: catalogoStats,
        startY: currentY,
        theme: 'plain',
        styles: { 
          fontSize: 11,
          cellPadding: { top: 5, right: 10, bottom: 5, left: 10 }
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100, fillColor: [248, 249, 250] },
          1: { cellWidth: 70, halign: 'center', fillColor: [255, 255, 255] }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // Agregar gráfico de géneros
      currentY = this.addGenreChart(doc, currentY);
      
      // Top películas mejorado
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('TOP PELÍCULAS MÁS POPULARES', 25, currentY + 5);
      currentY += 15;
      
      const peliculasData = this.stats.peliculasPopulares.map((pelicula, index) => [
        this.getRankIcon(index + 1),
        pelicula.titulo,
        pelicula.genero,
        `${pelicula.vistas}`,
        `${pelicula.rating.toFixed(1)}`,
        this.getPopularityLevel(pelicula.vistas)
      ]);
      
      autoTable(doc, {
        head: [['Pos', 'Título', 'Género', 'Vistas', 'Rating', 'Popularidad']],
        body: peliculasData,
        startY: currentY,
        theme: 'striped',
        headStyles: { 
          fillColor: [155, 89, 182],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 55 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 25, halign: 'center' }
        },
        alternateRowStyles: { fillColor: [248, 249, 250] }
      });
      
      // Configurar pie de página
      this.setupPDFFooter(doc);
      
      // Descargar PDF
      doc.save(`reporte-peliculas-${new Date().toISOString().split('T')[0]}.pdf`);
      
      this.generatingReport = false;
      this.toastService.showSuccess('Reporte de películas generado exitosamente');

    } catch (error) {
      console.error('Error generando reporte de películas:', error);
      this.generatingReport = false;
      this.toastService.showError('Error al generar el reporte de películas');
    }
  }

  /**
   * Generar reporte ejecutivo completo mejorado
   */
  generateCompleteReport(): void {
    this.generatingReport = true;
    this.toastService.showInfo('Generando reporte ejecutivo completo...');
    
    try {
      const doc = new jsPDF();
      
      // === PÁGINA 1: PORTADA Y RESUMEN ===
      this.setupPDFHeader(doc, 'REPORTE EJECUTIVO COMPLETO', 'Análisis Integral del Sistema ParkyFilms');
      
      let currentY = 110;
      
      // Resumen ejecutivo principal
      currentY = this.addExecutiveSummary(doc, currentY);
      
      // KPIs principales
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('INDICADORES CLAVE DE RENDIMIENTO', 25, currentY + 5);
      currentY += 20;
      
      const kpis = [
        ['Crecimiento de Usuarios', '+15% vs mes anterior'],
        ['Crecimiento de Ventas', '+23% vs mes anterior'],
        ['Satisfaccion de Usuarios', '4.6/5.0 estrellas'],
        ['Tiempo de Carga Promedio', '1.2 segundos'],
        ['Uptime del Sistema', '99.9% disponibilidad'],
        ['ROI Marketing', '340% retorno']
      ];
      
      kpis.forEach((kpi, index) => {
        const yPos = currentY + (index * 12);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${kpi[0]}:`, 25, yPos);
        doc.setTextColor(46, 204, 113);
        doc.text(kpi[1], 120, yPos);
      });
      
      currentY += (kpis.length * 12) + 15;
      
      // === PÁGINA 2: ANÁLISIS DETALLADO ===
      doc.addPage();
      this.setupPDFHeader(doc, 'ANÁLISIS DETALLADO', 'Desglose por categorías');
      
      currentY = 110;
      
      // Sección de Ventas
      doc.setFillColor(52, 152, 219);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('RENDIMIENTO DE VENTAS', 25, currentY + 5);
      currentY += 25;
      
      const ventasTop3 = this.stats.ventasRecientes.slice(0, 3).map(venta => [
        venta.usuario,
        venta.pelicula.length > 35 ? venta.pelicula.substring(0, 35) + '...' : venta.pelicula,
        `${venta.total.toFixed(2)}`,
        venta.estado === 'completada' ? 'Completada' : 
        venta.estado === 'pendiente' ? 'Pendiente' : 'Cancelada'
      ]);
      
      autoTable(doc, {
        head: [['Usuario', 'Película', 'Total', 'Estado']],
        body: ventasTop3,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219], fontSize: 10 },
        styles: { fontSize: 9 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // Sección de Películas
      doc.setFillColor(155, 89, 182);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('TOP PELICULAS', 25, currentY + 5);
      currentY += 20;
      
      const topPeliculas = this.stats.peliculasPopulares.slice(0, 4).map((pelicula, index) => [
        this.getRankIcon(index + 1),
        pelicula.titulo,
        pelicula.genero,
        `${pelicula.rating.toFixed(1)}`,
        `${pelicula.vistas}`
      ]);
      
      autoTable(doc, {
        head: [['Pos', 'Título', 'Género', 'Rating', 'Vistas']],
        body: topPeliculas,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [155, 89, 182], fontSize: 10 },
        styles: { fontSize: 9 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // === PÁGINA 3: RECOMENDACIONES Y PRÓXIMOS PASOS ===
      doc.addPage();
      this.setupPDFHeader(doc, 'ESTRATEGIA Y RECOMENDACIONES', 'Plan de acción propuesto');
      
      currentY = 110;
      
      // Recomendaciones estratégicas
      doc.setFillColor(46, 204, 113);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('RECOMENDACIONES ESTRATEGICAS', 25, currentY + 5);
      currentY += 25;
      
      const recomendaciones = [
        {
          categoria: 'Crecimiento',
          acciones: [
            'Expandir catalogo con generos emergentes (K-pop, documentales)',
            'Implementar sistema de recomendaciones personalizado',
            'Desarrollar aplicacion movil nativa'
          ]
        },
        {
          categoria: 'Retencion',
          acciones: [
            'Programa de fidelizacion con puntos y descuentos',
            'Membresias premium con beneficios exclusivos',
            'Sistema de notificaciones push para estrenos'
          ]
        },
        {
          categoria: 'Operacional',
          acciones: [
            'Automatizar reportes diarios y semanales',
            'Implementar chat en vivo para soporte',
            'Optimizar tiempos de carga del sistema'
          ]
        }
      ];
      
      recomendaciones.forEach(seccion => {
        doc.setFontSize(12);
        doc.setTextColor(52, 73, 94);
        doc.text(`${seccion.categoria.toUpperCase()}`, 25, currentY);
        currentY += 15;
        
        seccion.acciones.forEach(accion => {
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`• ${accion}`, 30, currentY);
          currentY += 8;
        });
        currentY += 5;
      });
      
      // Próximos pasos con timeline
      doc.setFillColor(230, 126, 34);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('ROADMAP - PRÓXIMOS PASOS', 25, currentY + 5);
      currentY += 25;
      
      const roadmap = [
        { periodo: 'Semana 1-2', tarea: 'Implementar sistema de notificaciones' },
        { periodo: 'Semana 3-4', tarea: 'Lanzar programa de fidelización beta' },
        { periodo: 'Mes 2', tarea: 'Desarrollar módulo de recomendaciones' },
        { periodo: 'Mes 3', tarea: 'Optimizar performance del sistema' },
        { periodo: 'Mes 4', tarea: 'Lanzar aplicación móvil MVP' }
      ];
      
      roadmap.forEach(item => {
        doc.setFontSize(11);
        doc.setTextColor(230, 126, 34);
        doc.text(`${item.periodo}:`, 25, currentY);
        doc.setTextColor(0, 0, 0);
        doc.text(item.tarea, 80, currentY);
        currentY += 12;
      });
      
      // Métricas de seguimiento
      currentY += 10;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      doc.text('MÉTRICAS DE SEGUIMIENTO RECOMENDADAS', 25, currentY + 5);
      currentY += 20;
      
      const metricas = [
        'Tasa de retención de usuarios mensual',
        'Tiempo promedio de permanencia en el sitio',
        'Conversión de visitantes a compradores',
        'Net Promoter Score (NPS)',
        'Ingresos por usuario activo (ARPU)'
      ];
      
      metricas.forEach(metrica => {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`${metrica}`, 30, currentY);
        currentY += 10;
      });
      
      // Configurar pie de página
      this.setupPDFFooter(doc);
      
      // Descargar PDF
      doc.save(`reporte-ejecutivo-completo-${new Date().toISOString().split('T')[0]}.pdf`);
      
      this.generatingReport = false;
      this.toastService.showSuccess('✅ Reporte ejecutivo completo generado exitosamente');
      
    } catch (error) {
      console.error('Error generando reporte ejecutivo:', error);
      this.generatingReport = false;
      this.toastService.showError('Error al generar el reporte ejecutivo');
    }
  }

  // ==================== MÉTODOS AUXILIARES PARA PDF ====================

  /**
   * Obtener icono de ranking
   */
  private getRankIcon(position: number): string {
    switch(position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  }

  /**
   * Obtener nivel de popularidad
   */
  private getPopularityLevel(vistas: number): string {
    if (vistas > 800) return 'Alta';
    if (vistas > 500) return 'Media';
    if (vistas > 200) return 'Buena';
    return 'Baja';
  }

  /**
   * Obtener badge de estado
   */
  private getEstadoBadge(estado: string): string {
    switch(estado) {
      case 'completada': return 'Completada';
      case 'pendiente': return 'Pendiente';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  }

  /**
   * Agregar sección de recomendaciones
   */
  private addRecommendations(doc: jsPDF, startY: number, recommendations: string[]): void {
    let currentY = startY;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(20, currentY - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(52, 73, 94);
    doc.text('RECOMENDACIONES', 25, currentY + 5);
    currentY += 20;
    
    recommendations.forEach(recommendation => {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`• ${recommendation}`, 25, currentY);
      currentY += 10;
    });
  }

  // ==================== ACCIONES RÁPIDAS ====================

  /**
   * Ver logs del sistema
   */
  viewSystemLogs(): void {
    const logs = [
      { fecha: new Date().toISOString(), nivel: 'INFO', mensaje: 'Sistema iniciado correctamente' },
      { fecha: new Date().toISOString(), nivel: 'SUCCESS', mensaje: 'Usuario admin conectado' },
      { fecha: new Date().toISOString(), nivel: 'INFO', mensaje: 'Estadísticas actualizadas' },
      { fecha: new Date().toISOString(), nivel: 'WARNING', mensaje: 'Memoria del servidor al 85%' },
      { fecha: new Date().toISOString(), nivel: 'INFO', mensaje: 'Backup automático completado' }
    ];
    
    console.log('===LOGS DEL SISTEMA ===');
    console.table(logs);
    console.log('===========================');
    
    this.toastService.showInfo('Logs del sistema mostrados en consola del navegador');
  }

  /**
   * Realizar backup del sistema
   */
  systemBackup(): void {
    const confirmBackup = confirm(
      '¿Estás seguro de que quieres realizar un backup del sistema?\n\n' +
      'Esta operación puede tomar algunos minutos y crear un archivo de respaldo completo.'
    );
    
    if (confirmBackup) {
      this.toastService.showInfo('Iniciando backup del sistema...');
      
      setTimeout(() => {
        const backupData = {
          timestamp: new Date().toISOString(),
          version: '2.1.0',
          database: {
            peliculas: this.stats.totalPeliculas,
            usuarios: this.stats.totalUsuarios,
            ventas: this.stats.totalVentas
          },
          system: {
            uptime: '99.9%',
            performance: 'optimal',
            storage: '2.3GB usado de 10GB'
          },
          integrity: 'verified',
          status: 'completed'
        };
        
        console.log('===BACKUP DEL SISTEMA ===');
        console.log(backupData);
        console.log('=============================');
        
        // Simular descarga del archivo de backup
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-sistema-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.toastService.showSuccess('Backup completado exitosamente y descargado');
      }, 3000);
    }
  }

  /**
   * Ver configuración del sistema
   */
  viewSettings(): void {
    this.toastService.showInfo('Redirigiendo a configuración del sistema...');
    this.router.navigate(['/admin/settings']);
  }

  /**
   * Modo mantenimiento
   */
  systemMaintenance(): void {
    const confirmMaintenance = confirm(
      '¿Estás seguro de que quieres activar el modo mantenimiento?\n\n' +
      '• Los usuarios no podrán acceder al sistema\n' +
      '• Se mostrará una página de mantenimiento\n' +
      '• Solo los administradores tendrán acceso\n\n' +
      'Esta acción afectará la experiencia de los usuarios.'
    );
    
    if (confirmMaintenance) {
      this.toastService.showWarning('Modo mantenimiento activado - Sistema en mantenimiento');
      console.log('Sistema en modo mantenimiento - Acceso restringido a administradores');
      
      // Aquí podrías implementar la lógica real de mantenimiento
      setTimeout(() => {
        this.toastService.showInfo('ℹPara desactivar el modo mantenimiento, usa el panel de configuración');
      }, 2000);
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
        version: '2.1.0',
        uptime: '99.9%',
        lastMaintenance: '2025-05-15',
        performance: 'optimal'
      }
    };
    
    // Crear y descargar archivo JSON para análisis
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.toastService.showSuccess('Datos exportados para análisis externo');
  }

  /**
   * Configurar alertas del sistema
   */
  setupSystemAlerts(): void {
    const alerts = {
      lowStorage: false,
      highUserActivity: this.stats.usuariosActivos > 50,
      salesTarget: this.stats.ingresosMes > 1000,
      systemHealth: 'good',
      memoryUsage: 85
    };
    
    console.log('Alertas del sistema:', alerts);
    
    if (alerts.highUserActivity) {
      this.toastService.showInfo('Alta actividad de usuarios detectada');
    }
    
    if (alerts.salesTarget) {
      this.toastService.showSuccess('¡Meta de ventas del mes alcanzada!');
    }
    
    if (alerts.memoryUsage > 80) {
      this.toastService.showWarning('⚠️ Uso de memoria alto: considera optimizar el sistema');
    }
  }
/**
 * Generar reporte combinado (películas + bar)
 */
generateCombinedReport(): void {
  this.generatingReport = true;
  this.toastService.showInfo('Generando reporte combinado (Cine + Bar)...');
  
  try {
    const doc = new jsPDF();
    const barStats = this.getBarStats();
    
    // Configurar encabezado
    this.setupPDFHeader(doc, 'REPORTE INTEGRAL PARKYFILMS', 'Análisis combinado de Cine y Bar');
    
    let currentY = 110;
    
    // Resumen ejecutivo combinado
    currentY = this.addExecutiveSummary(doc, currentY);
    
    // Sección del Bar
    doc.setFillColor(230, 126, 34);
    doc.rect(20, currentY - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('ANÁLISIS DEL BAR', 25, currentY + 5);
    currentY += 20;
    
    const barData = this.getTopBarProducts().slice(0, 5).map(prod => [
      prod.ranking ? `#${prod.ranking}` : '',
      prod.nombre,
      prod.categoria,
      prod.ventas.toString(),
      `$${prod.ingresos.toFixed(2)}`,
      prod.esCombo ? 'Sí' : 'No'
    ]);
    
    autoTable(doc, {
      head: [['Pos', 'Producto', 'Categoría', 'Ventas', 'Ingresos', 'Combo']],
      body: barData,
      startY: currentY,
      theme: 'striped',
      headStyles: { 
        fillColor: [230, 126, 34],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
      },
      alternateRowStyles: { fillColor: [255, 248, 220] }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 20;
    
    // Segunda página para películas si es necesario
    if (currentY > 200) {
      doc.addPage();
      currentY = 30;
    }
    
    // Sección del Cine
    doc.setFillColor(52, 152, 219);
    doc.rect(20, currentY - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('TOP PELÍCULAS', 25, currentY + 5);
    currentY += 20;
    
    const peliculasData = this.stats.peliculasPopulares.slice(0, 5).map((pelicula, index) => [
      this.getRankIcon(index + 1),
      pelicula.titulo,
      pelicula.genero,
      `${pelicula.vistas}`,
      `${pelicula.rating.toFixed(1)}`
    ]);
    
    autoTable(doc, {
      head: [['Pos', 'Título', 'Género', 'Vistas', 'Rating']],
      body: peliculasData,
      startY: currentY,
      theme: 'striped',
      headStyles: { 
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
      },
      alternateRowStyles: { fillColor: [248, 249, 250] }
    });
    
    // Configurar pie de página
    this.setupPDFFooter(doc);
    
    // Descargar PDF
    doc.save(`reporte-combinado-${new Date().toISOString().split('T')[0]}.pdf`);
    
    this.generatingReport = false;
    this.toastService.showSuccess('✅ Reporte combinado generado exitosamente');
    
  } catch (error) {
    console.error('Error generando reporte combinado:', error);
    this.generatingReport = false;
    this.toastService.showError('Error al generar el reporte combinado');
  }
}
  /**
   * Programar tareas de mantenimiento
   */
  scheduleMaintenanceTasks(): void {
    const tasks = [
      { task: 'Limpiar logs antiguos', scheduled: 'Domingo 02:00', status: 'pending', priority: 'medium' },
      { task: 'Backup automático', scheduled: 'Diario 03:00', status: 'active', priority: 'high' },
      { task: 'Actualizar estadísticas', scheduled: 'Cada hora', status: 'active', priority: 'high' },
      { task: 'Verificar integridad datos', scheduled: 'Lunes 01:00', status: 'pending', priority: 'high' },
      { task: 'Optimizar base de datos', scheduled: 'Miércoles 02:00', status: 'pending', priority: 'medium' },
      { task: 'Reinicio programado', scheduled: 'Sábados 04:00', status: 'active', priority: 'low' }
    ];
    
    console.log('===TAREAS PROGRAMADAS ===');
    console.table(tasks);
    console.log('=============================');
    
    this.toastService.showInfo('Tareas de mantenimiento programadas (ver consola para detalles)');
  }

}