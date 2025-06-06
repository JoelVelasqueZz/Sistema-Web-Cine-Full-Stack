// src/app/components/admin/admin-layout/admin-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MovieService } from '../../../services/movie.service';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { BarService } from '../../../services/bar.service';
import { Subscription, interval } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {

  currentSection = 'Dashboard';
  loading = false;
  refreshing = false;
  lastUpdate = '';
  
  private subscriptions = new Subscription();

  // Configuración de navegación simplificada
  navItems = [
    { route: '/admin/dashboard', label: 'Dashboard', section: 'Dashboard', icon: 'fas fa-tachometer-alt text-primary', badge: 'Home', badgeClass: 'bg-primary' },
    { route: '/admin/movies', label: 'Gestionar Películas', section: 'Gestión de Películas', icon: 'fas fa-film text-success', badge: () => this.getTotalMovies(), badgeClass: 'bg-success' },
    { route: '/admin/bar', label: 'Gestionar Bar', section: 'Gestión del Bar', icon: 'fas fa-utensils text-warning', badge: () => this.getTotalBarProducts(), badgeClass: 'bg-warning text-dark' },
    { route: '/admin/users', label: 'Gestionar Usuarios', section: 'Gestión de Usuarios', icon: 'fas fa-users text-info', badge: () => this.getTotalUsers(), badgeClass: 'bg-info' }
  ];

  toolItems = [
    { route: '/admin/reports', label: 'Reportes', section: 'Reportes', icon: 'fas fa-chart-bar text-warning', badge: 'fas fa-file-alt', badgeClass: 'bg-warning text-dark' },
    { route: '/admin/settings', label: 'Configuración', section: 'Configuración', icon: 'fas fa-cog text-secondary', badge: 'fas fa-wrench', badgeClass: 'bg-secondary' },
    { route: '/admin/logs', label: 'Logs del Sistema', section: 'Logs del Sistema', icon: 'fas fa-list-alt text-dark', badge: 'fas fa-eye', badgeClass: 'bg-dark' }
  ];

  quickActions = [
    { label: 'Agregar Película', icon: 'fas fa-plus', class: 'btn-outline-primary', action: () => this.quickAddMovie() },
    { label: 'Agregar Producto', icon: 'fas fa-utensils', class: 'btn-outline-warning', action: () => this.quickAddBarProduct() },
    { label: 'Generar Reporte', icon: 'fas fa-file-download', class: 'btn-outline-success', action: () => this.generateReport() },
    { label: 'Estado del Sistema', icon: 'fas fa-heartbeat', class: 'btn-outline-info', action: () => this.viewSystemStatus() }
  ];

  mobileNav = [
    { route: '/admin/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { route: '/admin/movies', icon: 'fas fa-film', label: 'Películas' },
    { route: '/admin/bar', icon: 'fas fa-utensils', label: 'Bar' },
    { route: '/admin/users', icon: 'fas fa-users', label: 'Usuarios' }
  ];

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

    this.subscriptions.add(
      this.router.events.pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => this.updateCurrentSection(event.urlAfterRedirects))
    );
    
    this.subscriptions.add(interval(60000).subscribe(() => this.updateLastUpdate()));
    this.updateLastUpdate();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private updateCurrentSection(url: string): void {
    const sections: Record<string, string> = {
      dashboard: 'Dashboard', movies: 'Gestión de Películas', bar: 'Gestión del Bar',
      users: 'Gestión de Usuarios', reports: 'Reportes', settings: 'Configuración', logs: 'Logs del Sistema'
    };
    this.currentSection = Object.entries(sections).find(([key]) => url.includes(key))?.[1] || 'Dashboard';
  }

  setCurrentSection(section: string): void { this.currentSection = section; }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('es-ES', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getLastUpdate(): string { return this.lastUpdate; }

  private updateLastUpdate(): void {
    this.lastUpdate = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getTotalMovies(): number { return this.movieService.getPeliculas().length; }
  getTotalUsers(): number { return this.adminService.getAllUsers().length; }
  getTotalBarProducts(): number { return this.barService.getProductos().length; }
  getDefaultAvatar(): string { return 'https://ui-avatars.com/api/?name=Admin&background=dc3545&color=fff&size=128'; }

  async refreshData(): Promise<void> {
    this.refreshing = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.updateLastUpdate();
      this.toastService.showSuccess('Datos actualizados correctamente');
      window.dispatchEvent(new CustomEvent('adminDataRefresh', { detail: { section: this.currentSection } }));
    } catch (error) {
      this.toastService.showError('Error al actualizar los datos');
    } finally {
      this.refreshing = false;
    }
  }

  logout(): void {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout();
      this.toastService.showInfo('Sesión cerrada. ¡Hasta pronto!');
      this.router.navigate(['/home']);
    }
  }

  quickAddMovie(): void {
    this.router.navigate(['/admin/movies'], { queryParams: { action: 'add' } });
    this.toastService.showInfo('Redirigiendo a agregar película...');
  }

  quickAddBarProduct(): void {
    this.router.navigate(['/admin/bar'], { queryParams: { action: 'add' } });
    this.toastService.showInfo('Redirigiendo a agregar producto del bar...');
  }

  async generateReport(): Promise<void> {
    this.loading = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const stats = this.adminService.getAdminStats();
      console.log('Reporte generado:', {
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        totalPeliculas: stats.totalPeliculas,
        totalUsuarios: stats.totalUsuarios,
        totalProductosBar: this.getTotalBarProducts(),
        ingresosMes: stats.ingresosMes,
        ventasRecientes: stats.ventasRecientes.length
      });
      this.toastService.showSuccess('Reporte generado exitosamente (ver consola)');
    } finally {
      this.loading = false;
    }
  }

  viewSystemStatus(): void {
    const status = { peliculas: this.getTotalMovies(), usuarios: this.getTotalUsers(), productosBar: this.getTotalBarProducts(), estado: 'Operativo', memoria: Math.floor(Math.random() * 40) + 20 };
    alert(`Estado del Sistema:\n\n• Películas: ${status.peliculas} registradas\n• Usuarios: ${status.usuarios} activos\n• Productos del Bar: ${status.productosBar} registrados\n• Última actualización: ${this.lastUpdate}\n• Estado: ${status.estado}\n• Memoria: ${status.memoria}% usado`);
    console.log('Estado del sistema:', status);
  }

  isRouteActive(route: string): boolean { return this.router.url.includes(route); }
  
  async navigateWithLoading(route: string[]): Promise<void> {
    this.loading = true;
    await this.router.navigate(route);
    setTimeout(() => this.loading = false, 500);
  }

  getActiveClass(route: string): string { return this.isRouteActive(route) ? 'active bg-primary text-white' : ''; }
  onSidebarClick(): void { if (window.innerWidth < 768) console.log('Click en sidebar móvil'); }
  onWindowResize(): void { console.log('Ventana redimensionada'); }
  
  showDebugInfo(): void {
    console.log('=== DEBUG ADMIN PANEL ===', {
      usuario: this.authService.getCurrentUser(), seccionActual: this.currentSection,
      ruta: this.router.url, ultimaActualizacion: this.lastUpdate
    });
  }
}