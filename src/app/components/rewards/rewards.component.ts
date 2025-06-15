import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PointsService } from '../../services/points.service';
import { RewardsService, Recompensa, CanjeRecompensa } from '../../services/rewards.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-rewards',
  standalone: false,
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.css']
})
export class RewardsComponent implements OnInit {

  // Estados del componente
  cargando: boolean = true;
  canjeando: boolean = false;
  
  // Datos del usuario
  userPoints: number = 0;
  userId: number = 0;
  
  // Recompensas
  allRewards: Recompensa[] = [];
  filteredRewards: Recompensa[] = [];
  categories: string[] = [];
  
  // Filtros
  selectedCategory: string = 'todas';
  sortBy: string = 'puntos-asc';
  searchTerm: string = '';
  showOnlyAffordable: boolean = false;
  
  // Canjes del usuario
  userRedemptions: CanjeRecompensa[] = [];
  activeRedemptions: CanjeRecompensa[] = [];
  
  // Vista actual
  currentView: 'catalog' | 'my-rewards' = 'catalog';
  
  // Recompensa seleccionada para modal
  selectedReward: Recompensa | null = null;

  constructor(
    public authService: AuthService,
    private pointsService: PointsService,
    private rewardsService: RewardsService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.showWarning('Debes iniciar sesión para ver las recompensas');
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserData();
    this.loadRewards();
  }

  // ==================== CARGA DE DATOS ====================

  private loadUserData(): void {
    this.pointsService.getUserPoints().subscribe({
      next: (response) => {
        this.userPoints = response.puntosActuales;
      },
      error: (error) => {
        console.error('❌ Error cargando puntos:', error);
        this.userPoints = 0;
      }
    });
  }

  loadRewards(): void {
    this.cargando = true;
    
    setTimeout(() => {
      this.allRewards = this.rewardsService.getAllRewards();
      this.categories = ['todas', ...this.rewardsService.getCategories()];
      this.applyFilters();
      this.cargando = false;
    }, 1000);
  }

  private loadUserRedemptions(): void {
    this.userRedemptions = this.rewardsService.getUserRedemptions();
    this.activeRedemptions = this.rewardsService.getActiveRedemptions();
  }

  // ==================== FILTRADO Y BÚSQUEDA ====================

  applyFilters(): void {
    let filtered = [...this.allRewards];

    // Filtro por categoría
    if (this.selectedCategory !== 'todas') {
      filtered = filtered.filter(reward => reward.categoria === this.selectedCategory);
    }

    // Filtro por término de búsqueda
    if (this.searchTerm.trim()) {
      filtered = this.rewardsService.searchRewards(this.searchTerm);
      if (this.selectedCategory !== 'todas') {
        filtered = filtered.filter(reward => reward.categoria === this.selectedCategory);
      }
    }

    // Filtro por asequibles
    if (this.showOnlyAffordable) {
      filtered = filtered.filter(reward => reward.puntosRequeridos <= this.userPoints);
    }

    // Ordenamiento
    switch (this.sortBy) {
      case 'puntos-asc':
        filtered.sort((a, b) => a.puntosRequeridos - b.puntosRequeridos);
        break;
      case 'puntos-desc':
        filtered.sort((a, b) => b.puntosRequeridos - a.puntosRequeridos);
        break;
      case 'nombre':
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'categoria':
        filtered.sort((a, b) => a.categoria.localeCompare(b.categoria));
        break;
    }

    this.filteredRewards = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleAffordableFilter(): void {
    this.showOnlyAffordable = !this.showOnlyAffordable;
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedCategory = 'todas';
    this.sortBy = 'puntos-asc';
    this.searchTerm = '';
    this.showOnlyAffordable = false;
    this.applyFilters();
  }

  // ==================== GESTIÓN DE RECOMPENSAS ====================

  canAffordReward(reward: Recompensa): boolean {
    return this.userPoints >= reward.puntosRequeridos;
  }

  openRewardModal(reward: Recompensa): void {
    this.selectedReward = reward;
    const modalElement = document.getElementById('rewardModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmRedeem(): void {
    if (!this.selectedReward) return;

    const confirmation = confirm(
      `¿Estás seguro de canjear "${this.selectedReward.nombre}" por ${this.selectedReward.puntosRequeridos} puntos?\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (confirmation) {
      this.redeemReward(this.selectedReward);
    }
  }

  redeemReward(reward: Recompensa): void {
    this.canjeando = true;
    
    this.rewardsService.redeemReward(reward.id).subscribe({
      next: (result) => {
        this.canjeando = false;
        
        if (result.success) {
          this.toastService.showSuccess(result.message);
          
          // Recargar puntos del usuario
          this.pointsService.getUserPoints().subscribe({
            next: (response) => {
              this.userPoints = response.puntosActuales;
            }
          });
          
          this.loadUserRedemptions();
          this.loadRewards(); // Recargar para actualizar stock
          
          // Cerrar modal
          this.closeRewardModal();
          
          // Mostrar información del canje
          if (result.canje) {
            this.showRedemptionDetails(result.canje);
          }
        } else {
          this.toastService.showError(result.message);
        }
      },
      error: (error) => {
        console.error('❌ Error canjeando recompensa:', error);
        this.canjeando = false;
        this.toastService.showError('Error al canjear la recompensa');
      }
    });
  }

  closeRewardModal(): void {
    const modalElement = document.getElementById('rewardModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.selectedReward = null;
  }

  showRedemptionDetails(canje: CanjeRecompensa): void {
    const message = `¡Canje exitoso!\n\n` +
                   `Código: ${canje.codigo}\n` +
                   `Válido hasta: ${this.formatDate(canje.fechaExpiracion)}\n\n` +
                   `Guarda este código para usar tu recompensa.`;
    
    setTimeout(() => {
      alert(message);
    }, 500);
  }

  // ==================== MÉTODOS DE VISTA ====================

  switchView(view: 'catalog' | 'my-rewards'): void {
    this.currentView = view;
    if (view === 'my-rewards') {
      this.loadUserRedemptions();
    }
  }

  useRedemption(canje: CanjeRecompensa): void {
    const confirmed = confirm(
      `¿Marcar como usado el canje "${canje.nombreRecompensa}"?\n\n` +
      `Código: ${canje.codigo}`
    );
    if (confirmed) {
      const success = this.rewardsService.markRedemptionAsUsed(canje.id);
      
      if (success) {
        this.toastService.showSuccess('Canje marcado como usado');
        this.loadUserRedemptions();
      } else {
        this.toastService.showError('Error al marcar canje como usado');
      }
    }
  }

  copyRedemptionCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.toastService.showSuccess('Código copiado al portapapeles');
    }).catch(() => {
      this.toastService.showError('Error al copiar código');
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCategoryName(category: string): string {
    const names: { [key: string]: string } = {
      'peliculas': 'Películas',
      'bar': 'Bar & Snacks',
      'especial': 'Especiales',
      'descuentos': 'Descuentos',
      'todas': 'Todas las categorías'
    };
    return names[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'peliculas': 'fas fa-film',
      'bar': 'fas fa-utensils',
      'especial': 'fas fa-star',
      'descuentos': 'fas fa-percent',
      'todas': 'fas fa-th-large'
    };
    return icons[category] || 'fas fa-gift';
  }

  getRewardTypeIcon(tipo: string): string {
    const icons: { [key: string]: string } = {
      'descuento': 'fas fa-percent',
      'producto': 'fas fa-box',
      'paquete': 'fas fa-gifts',
      'experiencia': 'fas fa-star',
      'codigo': 'fas fa-qrcode',
      'bonus': 'fas fa-gem'
    };
    return icons[tipo] || 'fas fa-gift';
  }

  getRewardTypeName(tipo: string): string {
    const names: { [key: string]: string } = {
      'descuento': 'Descuento',
      'producto': 'Producto',
      'paquete': 'Paquete',
      'experiencia': 'Experiencia',
      'codigo': 'Código',
      'bonus': 'Bonus'
    };
    return names[tipo] || tipo;
  }

  getRedeemButtonText(reward: Recompensa): string {
    if (!this.canAffordReward(reward)) {
      const missing = reward.puntosRequeridos - this.userPoints;
      return `Faltan ${missing} puntos`;
    }
    
    if (reward.stock <= 0) {
      return 'Agotado';
    }
    
    return `Canjear por ${reward.puntosRequeridos} puntos`;
  }

  isRedeemButtonDisabled(reward: Recompensa): boolean {
    return !this.canAffordReward(reward) || reward.stock <= 0 || this.canjeando;
  }

  getProgressToReward(reward: Recompensa): number {
    if (this.userPoints >= reward.puntosRequeridos) return 100;
    return Math.round((this.userPoints / reward.puntosRequeridos) * 100);
  }

  // ==================== FILTROS AUXILIARES ====================

  hasActiveFilters(): boolean {
    return this.selectedCategory !== 'todas' || 
           this.searchTerm.trim() !== '' || 
           this.showOnlyAffordable ||
           this.sortBy !== 'puntos-asc';
  }

  getFilterSummary(): string {
    const parts = [];
    
    if (this.selectedCategory !== 'todas') {
      parts.push(this.getCategoryName(this.selectedCategory));
    }
    
    if (this.searchTerm.trim()) {
      parts.push(`"${this.searchTerm}"`);
    }
    
    if (this.showOnlyAffordable) {
      parts.push('Solo asequibles');
    }
    
    return parts.join(' • ');
  }

  // ==================== MÉTODOS PARA FECHAS ====================

  /**
   * Verificar si un canje está expirado
   */
  isExpired(fechaExpiracion: string): boolean {
    return new Date(fechaExpiracion) <= new Date();
  }

  /**
   * Verificar si un canje está activo (no usado y no expirado)
   */
  isActive(canje: CanjeRecompensa): boolean {
    return !canje.usado && !this.isExpired(canje.fechaExpiracion);
  }

  /**
   * Verificar si un canje está usado
   */
  isUsed(canje: CanjeRecompensa): boolean {
    return canje.usado;
  }

  /**
   * Obtener clase CSS para el estado del canje
   */
  getCanjeStatusClass(canje: CanjeRecompensa): string {
    if (this.isUsed(canje)) return 'bg-secondary';
    if (this.isActive(canje)) return 'bg-success';
    return 'bg-warning'; // Expirado
  }

  /**
   * Obtener texto del estado del canje
   */
  getCanjeStatusText(canje: CanjeRecompensa): string {
    if (this.isUsed(canje)) return 'Usado';
    if (this.isActive(canje)) return 'Activo';
    return 'Expirado';
  }

  /**
   * Obtener icono del estado del canje
   */
  getCanjeStatusIcon(canje: CanjeRecompensa): string {
    if (this.isUsed(canje)) return 'fas fa-check';
    if (this.isActive(canje)) return 'fas fa-clock';
    return 'fas fa-times';
  }

  /**
   * Verificar si se puede marcar como usado
   */
  canMarkAsUsed(canje: CanjeRecompensa): boolean {
    return !canje.usado && !this.isExpired(canje.fechaExpiracion);
  }

  // ==================== NAVEGACIÓN (MÉTODOS FALTANTES AGREGADOS) ====================

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToMovies(): void {
    this.router.navigate(['/movies']);
  }

  goToBar(): void {
    this.router.navigate(['/bar']);
  }

  // 🆕 MÉTODO FALTANTE: Navegar al historial de puntos
  goToPointsHistory(): void {
    this.router.navigate(['/points-history']);
  }
}