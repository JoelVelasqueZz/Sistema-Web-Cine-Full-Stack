import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MovieService } from '../../../services/movie.service';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: false,  // ← ASEGÚRATE DE QUE ESTÉ EN false
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {

  currentSection: string = 'Dashboard';
  loading: boolean = false;
  refreshing: boolean = false;
  lastUpdate: string = '';
  
  private routerSubscription: Subscription = new Subscription();

  constructor(
    public authService: AuthService,
    private router: Router,
    private movieService: MovieService,
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Verificar permisos de admin
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para acceder al panel de administración');
      this.router.navigate(['/home']);
      return;
    }

    // Escuchar cambios de ruta para actualizar breadcrumbs
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateCurrentSection(event.urlAfterRedirects);
    });

    // Actualizar timestamp inicial
    this.updateLastUpdate();
    
    // Actualizar cada minuto
    setInterval(() => {
      this.updateLastUpdate();
    }, 60000);

    console.log('Panel de administración inicializado');
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // ==================== NAVEGACIÓN Y BREADCRUMBS ====================

  /**
   * Actualizar sección actual basada en la URL
   */
  private updateCurrentSection(url: string): void {
    if (url.includes('/admin/dashboard')) {
      this.currentSection = 'Dashboard';
    } else if (url.includes('/admin/movies')) {
      this.currentSection = 'Gestión de Películas';
    } else if (url.includes('/admin/users')) {
      this.currentSection = 'Gestión de Usuarios';
    } else if (url.includes('/admin/reports')) {
      this.currentSection = 'Reportes';
    } else if (url.includes('/admin/settings')) {
      this.currentSection = 'Configuración';
    } else if (url.includes('/admin/logs')) {
      this.currentSection = 'Logs del Sistema';
    } else {
      this.currentSection = 'Dashboard';
    }
  }

  /**
   * Establecer sección actual manualmente
   */
  setCurrentSection(section: string): void {
    this.currentSection = section;
  }

  // ==================== INFORMACIÓN DEL SISTEMA ====================

  /**
   * Obtener fecha y hora actual
   */
  getCurrentDateTime(): string {
    return new Date().toLocaleString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener timestamp de última actualización
   */
  getLastUpdate(): string {
    return this.lastUpdate;
  }

  /**
   * Actualizar timestamp de última actualización
   */
  private updateLastUpdate(): void {
    this.lastUpdate = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener total de películas
   */
  getTotalMovies(): number {
    return this.movieService.getPeliculas().length;
  }

  /**
   * Obtener total de usuarios
   */
  getTotalUsers(): number {
    // Esto debería venir del adminService cuando lo implementes
    return this.adminService.getAllUsers().length;
  }

  /**
   * Obtener avatar por defecto
   */
  getDefaultAvatar(): string {
    return 'https://ui-avatars.com/api/?name=Admin&background=dc3545&color=fff&size=128';
  }

  // ==================== ACCIONES DEL HEADER ====================

  /**
   * Refrescar datos del sistema
   */
  refreshData(): void {
    this.refreshing = true;
    
    // Simular carga de datos
    setTimeout(() => {
      this.refreshing = false;
      this.updateLastUpdate();
      this.toastService.showSuccess('Datos actualizados correctamente');
      
      // Aquí podrías recargar datos específicos según la sección actual
      this.reloadCurrentSectionData();
    }, 1500);
  }

  /**
   * Recargar datos de la sección actual
   */
  private reloadCurrentSectionData(): void {
    // Emit evento para que los componentes hijos se actualicen
    // En una implementación real, usarías un servicio de eventos
    window.dispatchEvent(new CustomEvent('adminDataRefresh', {
      detail: { section: this.currentSection }
    }));
  }

  /**
   * Logout del admin
   */
  logout(): void {
    const confirmar = confirm('¿Estás seguro de que quieres cerrar sesión?');
    
    if (confirmar) {
      this.authService.logout();
      this.toastService.showInfo('Sesión cerrada. ¡Hasta pronto!');
      this.router.navigate(['/home']);
    }
  }

  // ==================== ACCIONES RÁPIDAS ====================

  /**
   * Agregar película rápido
   */
  quickAddMovie(): void {
    // Redirigir al componente de gestión de películas con modo "agregar"
    this.router.navigate(['/admin/movies'], { 
      queryParams: { action: 'add' } 
    });
    
    this.toastService.showInfo('Redirigiendo a agregar película...');
  }

  /**
   * Generar reporte rápido
   */
  generateReport(): void {
    this.loading = true;
    
    // Simular generación de reporte
    setTimeout(() => {
      this.loading = false;
      
      const stats = this.adminService.getAdminStats();
      const reportData = {
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        totalPeliculas: stats.totalPeliculas,
        totalUsuarios: stats.totalUsuarios,
        ingresosMes: stats.ingresosMes,
        ventasRecientes: stats.ventasRecientes.length
      };
      
      console.log('Reporte generado:', reportData);
      this.toastService.showSuccess('Reporte generado exitosamente (ver consola)');
      
      // En una implementación real, aquí se descargaría un PDF o Excel
    }, 2000);
  }

  /**
   * Ver estado del sistema
   */
  viewSystemStatus(): void {
    const status = this.getSystemStatus();
    
    const mensaje = `Estado del Sistema:\n\n` +
                   `• Películas: ${status.peliculas} registradas\n` +
                   `• Usuarios: ${status.usuarios} activos\n` +
                   `• Última actualización: ${this.lastUpdate}\n` +
                   `• Estado: ${status.estado}\n` +
                   `• Memoria: ${status.memoria}% usado`;
    
    alert(mensaje);
    console.log('Estado del sistema:', status);
  }

  /**
   * Obtener estado del sistema
   */
  private getSystemStatus(): any {
    return {
      peliculas: this.getTotalMovies(),
      usuarios: this.getTotalUsers(),
      estado: 'Operativo',
      memoria: Math.floor(Math.random() * 40) + 20, // Simular 20-60%
      ultimaActualizacion: this.lastUpdate
    };
  }

  // ==================== UTILIDADES ====================

  /**
   * Verificar si una ruta está activa
   */
  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  /**
   * Navegar con loading
   */
  navigateWithLoading(route: string[]): void {
    this.loading = true;
    
    this.router.navigate(route).then(() => {
      setTimeout(() => {
        this.loading = false;
      }, 500);
    });
  }

  /**
   * Obtener clase CSS para enlaces activos
   */
  getActiveClass(route: string): string {
    return this.isRouteActive(route) ? 'active bg-primary text-white' : '';
  }

  // ==================== EVENTOS ====================

  /**
   * Manejar clicks en el sidebar (móvil)
   */
  onSidebarClick(): void {
    // En móvil, cerrar sidebar después de click
    if (window.innerWidth < 768) {
      // Aquí podrías cerrar un sidebar colapsible
      console.log('Click en sidebar móvil');
    }
  }

  /**
   * Manejar resize de ventana
   */
  onWindowResize(): void {
    // Aquí podrías ajustar la UI según el tamaño de pantalla
    console.log('Ventana redimensionada');
  }

  // ==================== DEBUG ====================

  /**
   * Mostrar información de debug (solo desarrollo)
   */
  showDebugInfo(): void {
    const debugInfo = {
      usuario: this.authService.getCurrentUser(),
      seccionActual: this.currentSection,
      ruta: this.router.url,
      ultimaActualizacion: this.lastUpdate,
      estadoSistema: this.getSystemStatus()
    };
    
    console.log('=== DEBUG ADMIN PANEL ===');
    console.log(debugInfo);
    console.log('========================');
  }
}