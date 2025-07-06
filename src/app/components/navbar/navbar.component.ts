import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Pelicula, MovieService } from '../../services/movie.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { PointsService } from '../../services/points.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  sugerencias: Pelicula[] = [];
  mostrarSugerencias: boolean = false;
  sugerenciaSeleccionada: number = -1;
  terminoBusqueda: string = '';

  // 🔥 PROPIEDADES PARA PUNTOS Y ESTADO
  userPoints: number = 0;
  loadingPoints: boolean = false;
  private pointsSubscription: Subscription = new Subscription();
  private authSubscription: Subscription = new Subscription(); // 🆕 NUEVA

  constructor(
    private router: Router,
    private movieService: MovieService,
    public authService: AuthService,
    public cartService: CartService,
    private pointsService: PointsService
  ) {}

  ngOnInit(): void {
    this.loadUserPoints();
    this.subscribeToAuthChanges();
  }

  ngOnDestroy(): void {
    // 🔥 LIMPIAR TODAS LAS SUSCRIPCIONES
    this.pointsSubscription.unsubscribe();
    this.authSubscription.unsubscribe();
  }

  // ==================== MÉTODOS DE ESTADO DEL USUARIO ====================

  /**
   * 🔥 MÉTODO PRINCIPAL: Verificar si está logueado
   */
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  /**
   * 🔥 MÉTODO PRINCIPAL: Obtener datos del usuario actual
   */
  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  /**
   * 🔥 MÉTODO PRINCIPAL: Obtener nombre del usuario
   */
  getUserName(): string {
    const user = this.getCurrentUser();
    return user?.nombre || 'Usuario';
  }

  /**
   * 🔥 MÉTODO PRINCIPAL: Obtener email del usuario
   */
  getUserEmail(): string {
    const user = this.getCurrentUser();
    return user?.email || '';
  }

  /**
   * 🔥 MÉTODO PRINCIPAL: Obtener avatar del usuario
   */
  getUserAvatar(): string {
    const user = this.getCurrentUser();
    if (user?.avatar) {
      return user.avatar;
    }
    
    const userName = this.getUserName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6c757d&color=fff&size=128`;
  }

  /**
   * 🔥 MÉTODO PRINCIPAL: Obtener rol del usuario
   */
  getUserRole(): string {
    const user = this.getCurrentUser();
    return user?.role || 'cliente';
  }

  /**
   * 🔥 MÉTODO PRINCIPAL: Verificar si es admin
   */
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /**
   * 🔥 MÉTODO PRINCIPAL: Verificar si es usuario OAuth
   */
  isOAuthUser(): boolean {
    return this.authService.isOAuthUser();
  }

  /**
   * 🔥 MÉTODO PRINCIPAL: Obtener proveedor OAuth
   */
  getOAuthProvider(): string {
    const provider = this.authService.getOAuthProvider();
    if (!provider) return '';
    
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  }

  // ==================== MÉTODOS DE PUNTOS (ACTUALIZADOS) ====================

  private loadUserPoints(): void {
    if (this.authService.isLoggedIn()) {
      this.loadingPoints = true;
      
      this.pointsSubscription = this.pointsService.userPoints$.subscribe({
        next: (points) => {
          this.userPoints = points;
          this.loadingPoints = false;
          console.log('✅ Puntos cargados:', points);
        },
        error: (error) => {
          console.error('❌ Error cargando puntos:', error);
          this.loadingPoints = false;
          // Usar método legacy como fallback
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            this.userPoints = this.pointsService.getUserPoints_Legacy(currentUser.id);
          }
        }
      });

      this.pointsService.getUserPoints().subscribe();
    }
  }

  private subscribeToAuthChanges(): void {
    // 🔥 SUSCRIPCIÓN MEJORADA A CAMBIOS DE AUTH
    this.authSubscription = this.authService.authStatus$.subscribe((isLoggedIn) => {
      console.log('🔍 Estado de auth cambió en navbar:', isLoggedIn);
      
      if (isLoggedIn) {
        this.loadUserPoints();
      } else {
        this.clearUserData();
      }
    });
  }

  /**
   * 🔥 LIMPIAR DATOS DEL USUARIO
   */
  private clearUserData(): void {
    this.userPoints = 0;
    this.pointsSubscription.unsubscribe();
    this.pointsSubscription = new Subscription();
    this.cerrarSugerencias();
    this.terminoBusqueda = '';
  }

  /**
   * Obtener puntos del usuario (para el template)
   */
  getUserPoints(): number {
    return this.userPoints;
  }

  // ==================== MÉTODOS DE NAVEGACIÓN (NUEVOS) ====================

  /**
   * 🔥 NAVEGAR AL PERFIL
   */
  goToProfile(): void {
    if (this.isLoggedIn()) {
      this.router.navigate(['/profile']);
    } else {
      this.goToLogin();
    }
  }

  /**
   * 🔥 NAVEGAR A FAVORITAS
   */
  goToFavorites(): void {
    if (this.isLoggedIn()) {
      this.router.navigate(['/favorites']);
    } else {
      this.goToLogin();
    }
  }

  /**
   * 🔥 NAVEGAR AL HISTORIAL
   */
  goToHistory(): void {
    if (this.isLoggedIn()) {
      this.router.navigate(['/history']);
    } else {
      this.goToLogin();
    }
  }

  /**
   * 🔥 NAVEGAR A RECOMPENSAS
   */
  goToRewards(): void {
    if (this.isLoggedIn()) {
      this.router.navigate(['/rewards']);
    } else {
      this.goToLogin();
    }
  }

  /**
   * 🔥 NAVEGAR AL HISTORIAL DE PUNTOS
   */
  goToPointsHistory(): void {
    if (this.isLoggedIn()) {
      this.router.navigate(['/points-history']);
    } else {
      this.goToLogin();
    }
  }

  /**
   * 🔥 NAVEGAR AL HISTORIAL DE ÓRDENES
   */
  goToOrderHistory(): void {
    if (this.isLoggedIn()) {
      this.router.navigate(['/order-history']);
    } else {
      this.goToLogin();
    }
  }

  /**
   * 🔥 NAVEGAR AL LOGIN
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * 🔥 NAVEGAR AL REGISTRO
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  /**
   * 🔥 VER CARRITO
   */
  viewCart(): void {
    this.router.navigate(['/cart']);
  }

  // ==================== MÉTODOS ADMIN (NUEVOS) ====================

  goToAdminDashboard(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  goToAdminMovies(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/movies']);
    }
  }

  goToAdminUsers(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/users']);
    }
  }

  goToAdminBar(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/bar']);
    }
  }

  goToAdminFunctions(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/functions']);
    }
  }

  goToAdminPoints(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/points']);
    }
  }

  goToAdminRewards(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/rewards']);
    }
  }

  // ==================== BÚSQUEDA (SIN CAMBIOS IMPORTANTES) ====================

  onBuscarInput(event: any) {
    this.terminoBusqueda = event.target.value;
    
    if (this.terminoBusqueda.trim().length === 0) {
      this.sugerencias = [];
      this.mostrarSugerencias = false;
      return;
    }

    if (this.terminoBusqueda.trim().length >= 2) {
      this.movieService.buscarPeliculas(this.terminoBusqueda).subscribe({
        next: (peliculas: Pelicula[]) => {
          console.log('📡 Sugerencias de API:', peliculas.length);
          this.sugerencias = peliculas.slice(0, 5);
          this.mostrarSugerencias = this.sugerencias.length > 0;
          this.sugerenciaSeleccionada = -1;
        },
        error: (error) => {
          console.error('❌ Error en sugerencias:', error);
          this.sugerencias = [];
          this.mostrarSugerencias = false;
        }
      });
    }
  }

  /**
   * 🔥 MÉTODO DE BÚSQUEDA MEJORADO
   */
  onSearch(): void {
    if (this.terminoBusqueda.trim()) {
      this.buscarPelicula(this.terminoBusqueda.trim());
    }
  }

  seleccionarSugerencia(pelicula: Pelicula) {
    this.cerrarSugerencias();
    const movieId = pelicula.id || pelicula.idx;
    console.log('🎬 Navegando a película con ID:', movieId);
    this.router.navigate(['/movie', movieId]);
  }

  cerrarSugerencias() {
    this.mostrarSugerencias = false;
    this.sugerenciaSeleccionada = -1;
  }

  buscarPelicula(termino: string) {
    console.log('🔍 Término de búsqueda:', termino);
    
    if (!termino || termino.trim().length === 0) {
      console.log('⚠️ Búsqueda vacía');
      return;
    }
    
    this.cerrarSugerencias();
    const terminoLimpio = termino.trim();
    console.log('🧭 Navegando a /buscar/' + terminoLimpio);
    
    this.router.navigate(['/buscar', terminoLimpio]).then(success => {
      if (success) {
        console.log('✅ Navegación exitosa');
        this.terminoBusqueda = '';
      }
    }).catch(error => {
      console.error('❌ Error en navegación:', error);
    });
  }

  // ==================== LOGOUT MEJORADO ====================

  /**
   * 🔥 LOGOUT CON CONFIRMACIÓN
   */
  logout(): void {
    console.log('🚪 Cerrando sesión...');
    
    // Confirmar logout
    const confirmLogout = confirm('¿Estás seguro de que quieres cerrar sesión?');
    
    if (confirmLogout) {
      // Limpiar datos locales
      this.clearUserData();
      
      // Cerrar sesión en el servicio
      this.authService.logout();
      
      // Redirigir al home
      this.router.navigate(['/']);
      
      console.log('✅ Sesión cerrada exitosamente');
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtener cantidad de items en carrito
   */
  getCartItemsCount(): number {
    return this.cartService.getItemCount();
  }

  /**
   * Verificar si una ruta está activa
   */
  isRouteActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  /**
   * 🔥 ACTUALIZAR PUNTOS MANUALMENTE
   */
  updatePoints(): void {
    console.log('🔄 Actualizando puntos...');
    this.refreshPoints();
  }

  /**
   * 🔥 COMPARTIR CÓDIGO DE REFERIDO
   */
  shareReferralCode(): void {
    console.log('📤 Compartiendo código de referido...');
    
    if (!this.isLoggedIn()) {
      this.goToLogin();
      return;
    }
    
    // Generar código de referido
    const referralCode = this.generateReferralCode();
    
    // Copiar al portapapeles
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralCode).then(() => {
        console.log('✅ Código copiado al portapapeles:', referralCode);
        alert(`¡Código de referido copiado! Compártelo: ${referralCode}`);
      }).catch(() => {
        // Fallback si no funciona clipboard
        prompt('Copia tu código de referido:', referralCode);
      });
    } else {
      // Fallback para navegadores sin clipboard API
      prompt('Copia tu código de referido:', referralCode);
    }
  }

  /**
   * Generar código de referido simple
   */
  private generateReferralCode(): string {
    const user = this.getCurrentUser();
    if (!user) return 'GUEST001';
    
    const prefix = user.nombre.substring(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `${prefix}${user.id}${suffix}`;
  }

  // ==================== MÉTODOS LEGACY (MANTENIDOS PARA COMPATIBILIDAD) ====================

  getPointsDisplayText(): string {
    if (this.loadingPoints) {
      return '...';
    }
    
    if (this.userPoints === 0) {
      return '0';
    }
    
    if (this.userPoints >= 1000) {
      return (this.userPoints / 1000).toFixed(1) + 'k';
    }
    
    return this.userPoints.toString();
  }

  getPointsValueText(): string {
    const value = this.userPoints / 1;
    return `$${value.toFixed(2)}`;
  }

  shouldShowPoints(): boolean {
    return this.authService.isLoggedIn() && !this.loadingPoints;
  }

  refreshPoints(): void {
    if (this.authService.isLoggedIn()) {
      this.loadingPoints = true;
      this.pointsService.getUserPoints().subscribe({
        next: () => {
          console.log('✅ Puntos actualizados');
        },
        error: (error) => {
          console.error('❌ Error actualizando puntos:', error);
          this.loadingPoints = false;
        }
      });
    }
  }

  getPointsBadgeClass(): string {
    if (this.userPoints === 0) {
      return 'bg-secondary';
    } else if (this.userPoints < 100) {
      return 'bg-info';
    } else if (this.userPoints < 500) {
      return 'bg-success';
    } else {
      return 'bg-warning text-dark';
    }
  }

  getPointsTooltip(): string {
    if (this.loadingPoints) {
      return 'Cargando puntos...';
    }
    
    if (this.userPoints === 0) {
      return 'No tienes puntos. ¡Compra entradas para ganar puntos!';
    }
    
    return `Tienes ${this.userPoints} puntos (equivalente a ${this.getPointsValueText()})`;
  }

  isRewardsActive(): boolean {
    return this.router.url === '/rewards';
  }

  isProfileActive(): boolean {
    return this.router.url === '/profile';
  }

  showEarnPointsInfo(): void {
    const modalElement = document.getElementById('pointsInfoModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  showPointsUsageInfo(): void {
    const modalElement = document.getElementById('pointsUsageModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  getUserPointsValue(): number {
    return this.userPoints / 1;
  }

  getMaxPointsToUse(): number {
    return this.userPoints;
  }

  onPointsClick(): void {
    if (this.isRewardsActive()) {
      this.goToProfile();
    } else {
      this.goToRewards();
    }
  }
}