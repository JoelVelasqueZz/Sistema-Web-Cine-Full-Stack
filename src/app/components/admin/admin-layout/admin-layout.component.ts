// src/app/components/admin/admin-layout/admin-layout.component.ts
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
  standalone: false,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  
  currentSection: string = 'Dashboard';
  loading: boolean = false;
  refreshing: boolean = false;
  lastUpdate: string = '';
  
  // PROPIEDADES PARA CACHE
  private totalMovies: number = 0;
  private totalUsers: number = 0;
  private totalBarProducts: number = 0;
  private totalComingSoon: number = 0;
  private totalFunctions: number = 0; // ✅ AGREGADO
  
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
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para acceder al panel de administración');
      this.router.navigate(['/home']);
      return;
    }

    this.loadInitialData();

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateCurrentSection(event.urlAfterRedirects);
    });

    this.updateLastUpdate();
    
    setInterval(() => {
      this.updateLastUpdate();
    }, 60000);

    console.log('Panel de administración inicializado');
  }
  getTotalRewards(): number {
  // 🔧 Por ahora regresa 0, luego puedes conectar con el servicio real
  return 0; // placeholder - puedes implementar la lógica real después
}
quickAddReward(): void {
  // 🔧 Navegar a crear nueva recompensa
  console.log('📝 Navegando a agregar nueva recompensa...');
  this.router.navigate(['/admin/rewards']).then(() => {
    // Si tienes un modal o formulario específico, puedes agregarlo aquí
    console.log('✅ Navegación completada a /admin/rewards');
  });
}
  // ✅ MÉTODO ACTUALIZADO PARA CARGAR DATOS INICIALES
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

    // Cargar total de próximos estrenos
    this.movieService.getProximosEstrenosHybrid().subscribe(
      estrenos => {
        this.totalComingSoon = estrenos.length;
      },
      error => {
        console.error('Error al cargar próximos estrenos:', error);
        this.totalComingSoon = 0;
      }
    );

    // ✅ CARGAR TOTAL DE FUNCIONES (simulado por ahora)
    try {
      // Valor simulado - puedes implementar un método real después
      this.totalFunctions = 15;
    } catch (error) {
      console.error('Error al cargar funciones:', error);
      this.totalFunctions = 0;
    }

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

  // ==================== MÉTODOS GETTER ====================

  getTotalMovies(): number {
    return this.totalMovies;
  }

  getTotalUsers(): number {
    return this.totalUsers;
  }

  getTotalBarProducts(): number {
    return this.totalBarProducts;
  }

  getTotalComingSoon(): number {
    return this.totalComingSoon;
  }

  // ✅ MÉTODO FALTANTE AGREGADO
  getTotalFunctions(): number {
    return this.totalFunctions;
  }

  // ==================== MÉTODO REFRESH ACTUALIZADO ====================

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

  // ✅ MÉTODO updateCurrentSection ACTUALIZADO
  private updateCurrentSection(url: string): void {
    if (url.includes('/admin/dashboard')) {
      this.currentSection = 'Dashboard';
    } else if (url.includes('/admin/movies')) {
      this.currentSection = 'Gestión de Películas';
    } else if (url.includes('/admin/coming-soon')) {
      this.currentSection = 'Gestión de Próximos Estrenos';
    } else if (url.includes('/admin/functions')) { // ✅ AGREGADO
      this.currentSection = 'Gestión de Funciones';
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

  // ==================== MÉTODO quickAddComingSoon ====================

  quickAddComingSoon(): void {
    this.router.navigate(['/admin/coming-soon'], { 
      queryParams: { action: 'add' } 
    });
    
    this.toastService.showInfo('Redirigiendo a agregar próximo estreno...');
  }

  quickAddFuncion(): void {
    this.router.navigate(['/admin/functions'], { 
      queryParams: { action: 'add' } 
    });
    
    this.toastService.showInfo('Redirigiendo a agregar función...');
  }

  // ✅ MÉTODO getSystemStatus ACTUALIZADO
  private getSystemStatus(): any {
    return {
      peliculas: this.totalMovies,
      proximosEstrenos: this.totalComingSoon,
      funciones: this.totalFunctions, // ✅ AGREGADO
      usuarios: this.totalUsers,
      productosBar: this.totalBarProducts,
      estado: 'Operativo',
      memoria: Math.floor(Math.random() * 40) + 20,
      ultimaActualizacion: this.lastUpdate
    };
  }

  // ✅ MÉTODO viewSystemStatus ACTUALIZADO
  viewSystemStatus(): void {
    const status = this.getSystemStatus();
    
    const mensaje = `Estado del Sistema:\n\n` +
                   `• Películas: ${status.peliculas} registradas\n` +
                   `• Próximos Estrenos: ${status.proximosEstrenos} programados\n` +
                   `• Funciones: ${status.funciones} programadas\n` + // ✅ AGREGADO
                   `• Usuarios: ${status.usuarios} activos\n` +
                   `• Productos del Bar: ${status.productosBar} registrados\n` +
                   `• Última actualización: ${this.lastUpdate}\n` +
                   `• Estado: ${status.estado}\n` +
                   `• Memoria: ${status.memoria}% usado`;
    
    alert(mensaje);
    console.log('Estado del sistema:', status);
  }

  // ==================== RESTO DE MÉTODOS (SIN CAMBIOS) ====================

  setCurrentSection(section: string): void {
    this.currentSection = section;
  }

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

  getLastUpdate(): string {
    return this.lastUpdate;
  }

  private updateLastUpdate(): void {
    this.lastUpdate = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDefaultAvatar(): string {
    return 'https://ui-avatars.com/api/?name=Admin&background=dc3545&color=fff&size=128';
  }

  private reloadCurrentSectionData(): void {
    window.dispatchEvent(new CustomEvent('adminDataRefresh', {
      detail: { section: this.currentSection }
    }));
  }

  logout(): void {
    const confirmar = confirm('¿Estás seguro de que quieres cerrar sesión?');
    
    if (confirmar) {
      this.authService.logout();
      this.toastService.showInfo('Sesión cerrada. ¡Hasta pronto!');
      this.router.navigate(['/home']);
    }
  }

  quickAddMovie(): void {
    this.router.navigate(['/admin/movies'], { 
      queryParams: { action: 'add' } 
    });
    
    this.toastService.showInfo('Redirigiendo a agregar película...');
  }

  quickAddBarProduct(): void {
    this.router.navigate(['/admin/bar'], { 
      queryParams: { action: 'add' } 
    });
    
    this.toastService.showInfo('Redirigiendo a agregar producto del bar...');
  }

  generateReport(): void {
    this.loading = true;
    
    this.adminService.getAdminStats().subscribe(
      stats => {
        setTimeout(() => {
          this.loading = false;
          
          const reportData = {
            fechaGeneracion: new Date().toLocaleString('es-ES'),
            totalPeliculas: stats.totalPeliculas,
            totalProximosEstrenos: this.totalComingSoon,
            totalFunciones: this.totalFunctions, // ✅ AGREGADO
            totalUsuarios: stats.totalUsuarios,
            totalProductosBar: this.totalBarProducts,
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

  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  navigateWithLoading(route: string[]): void {
    this.loading = true;
    
    this.router.navigate(route).then(() => {
      setTimeout(() => {
        this.loading = false;
      }, 500);
    });
  }

  getActiveClass(route: string): string {
    return this.isRouteActive(route) ? 'active bg-primary text-white' : '';
  }

  onSidebarClick(): void {
    if (window.innerWidth < 768) {
      console.log('Click en sidebar móvil');
    }
  }

  onWindowResize(): void {
    console.log('Ventana redimensionada');
  }

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