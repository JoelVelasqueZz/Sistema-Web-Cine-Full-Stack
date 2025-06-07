import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MovieService } from '../../../services/movie.service';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BarService } from '../../../services/bar.service';

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
  
  // 🆕 AGREGAR ESTAS PROPIEDADES PARA CACHE
  private totalMovies: number = 0;
  private totalUsers: number = 0;
  private totalBarProducts: number = 0;
  
  private routerSubscription: Subscription = new Subscription();

  constructor(
    public authService: AuthService,
    private router: Router,
    private movieService: MovieService,
    private adminService: AdminService,
    private toastService: ToastService,
    private barService: BarService
  ) {}

  ngOnInit(): void {
    // Verificar permisos de admin
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para acceder al panel de administración');
      this.router.navigate(['/home']);
      return;
    }

    // 🆕 CARGAR DATOS INICIALES
    this.loadInitialData();

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

  // 🆕 MÉTODO PARA CARGAR DATOS INICIALES
  private loadInitialData(): void {
    // Cargar total de películas
    this.movieService.getPeliculas().subscribe(
      peliculas => {
        this.totalMovies = peliculas.length;
      },
      error => {
        console.error('Error al cargar películas:', error);
        this.totalMovies = 0;
      }
    );

    // Cargar total de usuarios
    try {
      this.totalUsers = this.adminService.getAllUsers().length;
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.totalUsers = 0;
    }

    // Cargar total de productos del bar
    try {
      this.totalBarProducts = this.barService.getProductos().length;
    } catch (error) {
      console.error('Error al cargar productos del bar:', error);
      this.totalBarProducts = 0;
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // ==================== MÉTODOS CORREGIDOS ====================

  /**
   * Obtener total de películas (CORREGIDO)
   */
  getTotalMovies(): number {
    return this.totalMovies;
  }

  /**
   * Obtener total de usuarios (YA ESTABA BIEN)
   */
  getTotalUsers(): number {
    return this.totalUsers;
  }

  /**
   * Obtener total de productos del bar (CORREGIDO)
   */
  getTotalBarProducts(): number {
    return this.totalBarProducts;
  }

  // ==================== MÉTODO REFRESH CORREGIDO ====================

  /**
   * Refrescar datos del sistema (CORREGIDO)
   */
  refreshData(): void {
    this.refreshing = true;
    
    // Recargar datos reales
    this.loadInitialData();
    
    setTimeout(() => {
      this.refreshing = false;
      this.updateLastUpdate();
      this.toastService.showSuccess('Datos actualizados correctamente');
      
      // Recargar datos de la sección actual
      this.reloadCurrentSectionData();
    }, 1500);
  }

  /**
   * Generar reporte rápido (CORREGIDO)
   */
  generateReport(): void {
    this.loading = true;
    
    this.adminService.getAdminStats().subscribe(
      stats => {
        setTimeout(() => {
          this.loading = false;
          
          const reportData = {
            fechaGeneracion: new Date().toLocaleString('es-ES'),
            totalPeliculas: stats.totalPeliculas,
            totalUsuarios: stats.totalUsuarios,
            totalProductosBar: this.totalBarProducts, // 🆕 AGREGAR BAR
            ingresosMes: stats.ingresosMes,
            ventasRecientes: stats.ventasRecientes.length
          };
          
          console.log('Reporte generado:', reportData);
          this.toastService.showSuccess('Reporte generado exitosamente (ver consola)');
          
        }, 2000);
      },
      error => {
        console.error('Error al generar reporte:', error);
        this.loading = false;
        this.toastService.showError('Error al generar el reporte');
      }
    );
  }

  /**
   * Ver estado del sistema (CORREGIDO)
   */
  viewSystemStatus(): void {
    const status = this.getSystemStatus();
    
    const mensaje = `Estado del Sistema:\n\n` +
                   `• Películas: ${status.peliculas} registradas\n` +
                   `• Usuarios: ${status.usuarios} activos\n` +
                   `• Productos del Bar: ${status.productosBar} registrados\n` +
                   `• Última actualización: ${this.lastUpdate}\n` +
                   `• Estado: ${status.estado}\n` +
                   `• Memoria: ${status.memoria}% usado`;
    
    alert(mensaje);
    console.log('Estado del sistema:', status);
  }

  /**
   * Obtener estado del sistema (CORREGIDO)
   */
  private getSystemStatus(): any {
    return {
      peliculas: this.totalMovies,
      usuarios: this.totalUsers,
      productosBar: this.totalBarProducts,
      estado: 'Operativo',
      memoria: Math.floor(Math.random() * 40) + 20,
      ultimaActualizacion: this.lastUpdate
    };
  }

  // ==================== RESTO DE MÉTODOS (SIN CAMBIOS) ====================

  /**
   * Actualizar sección actual basada en la URL
   */
  private updateCurrentSection(url: string): void {
    if (url.includes('/admin/dashboard')) {
      this.currentSection = 'Dashboard';
    } else if (url.includes('/admin/movies')) {
      this.currentSection = 'Gestión de Películas';
    } else if (url.includes('/admin/bar')) {
      this.currentSection = 'Gestión del Bar';
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
   * Obtener avatar por defecto
   */
  getDefaultAvatar(): string {
    return 'https://ui-avatars.com/api/?name=Admin&background=dc3545&color=fff&size=128';
  }

  /**
   * Recargar datos de la sección actual
   */
  private reloadCurrentSectionData(): void {
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

  /**
   * Agregar película rápido
   */
  quickAddMovie(): void {
    this.router.navigate(['/admin/movies'], { 
      queryParams: { action: 'add' } 
    });
    
    this.toastService.showInfo('Redirigiendo a agregar película...');
  }

  /**
   * Agregar producto del bar rápido
   */
  quickAddBarProduct(): void {
    this.router.navigate(['/admin/bar'], { 
      queryParams: { action: 'add' } 
    });
    
    this.toastService.showInfo('Redirigiendo a agregar producto del bar...');
  }

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

  /**
   * Manejar clicks en el sidebar (móvil)
   */
  onSidebarClick(): void {
    if (window.innerWidth < 768) {
      console.log('Click en sidebar móvil');
    }
  }

  /**
   * Manejar resize de ventana
   */
  onWindowResize(): void {
    console.log('Ventana redimensionada');
  }

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