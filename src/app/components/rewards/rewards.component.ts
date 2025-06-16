import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
export class RewardsComponent implements OnInit, OnDestroy {

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

  // Suscripciones
  private subscriptions = new Subscription();

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

    this.loadInitialData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ==================== INICIALIZACIÓN ====================

  private loadInitialData(): void {
    this.cargando = true;
    
    // Cargar puntos del usuario
    this.loadUserPoints();
    
    // Cargar recompensas
    this.loadRewards();
    
    // Cargar categorías
    this.loadCategories();
    
    // Cargar canjes del usuario
    this.loadUserRedemptions();
  }

  private setupSubscriptions(): void {
    // Suscribirse a cambios en puntos
    this.subscriptions.add(
      this.pointsService.userPoints$.subscribe(points => {
        this.userPoints = points;
        this.applyFilters(); // Reaplica filtros cuando cambian los puntos
      })
    );

    // Suscribirse a cambios en recompensas
    this.subscriptions.add(
      this.rewardsService.rewards$.subscribe(rewards => {
        this.allRewards = rewards;
        this.applyFilters();
        
        if (this.cargando && rewards.length > 0) {
          this.cargando = false;
        }
      })
    );

    // Suscribirse a cambios en canjes
    this.subscriptions.add(
      this.rewardsService.userRedemptions$.subscribe(redemptions => {
        this.userRedemptions = redemptions;
        this.activeRedemptions = this.rewardsService.getActiveRedemptions();
      })
    );
  }

  // ==================== CARGA DE DATOS ====================

  private loadUserPoints(): void {
    this.subscriptions.add(
      this.pointsService.getUserPoints().subscribe({
        next: (response) => {
          this.userPoints = response.puntosActuales;
          console.log('✅ Puntos del usuario cargados:', this.userPoints);
        },
        error: (error) => {
          console.error('❌ Error cargando puntos:', error);
          this.userPoints = 0;
        }
      })
    );
  }

  private loadRewards(): void {
    // El servicio ya carga automáticamente las recompensas
    this.rewardsService.loadAllRewards();
  }

  private loadCategories(): void {
    this.subscriptions.add(
      this.rewardsService.getCategories().subscribe({
        next: (categories) => {
          this.categories = ['todas', ...categories];
          console.log('✅ Categorías cargadas:', this.categories);
        },
        error: (error) => {
          console.error('❌ Error cargando categorías:', error);
          this.categories = ['todas', 'peliculas', 'bar', 'especial', 'descuentos'];
        }
      })
    );
  }

  private loadUserRedemptions(): void {
    // El servicio ya carga automáticamente los canjes
    this.rewardsService.loadUserRedemptions();
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
      const searchTerm = this.searchTerm.toLowerCase();
      filtered = filtered.filter(reward => 
        reward.nombre.toLowerCase().includes(searchTerm) ||
        reward.descripcion.toLowerCase().includes(searchTerm)
      );
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
    
    this.subscriptions.add(
      this.rewardsService.redeemReward(reward.id).subscribe({
        next: (result) => {
          this.canjeando = false;
          
          if (result.success) {
            this.toastService.showSuccess(result.message);
            
            // Cerrar modal
            this.closeRewardModal();
            
            // Mostrar información del canje
            if (result.canje) {
              this.showRedemptionDetails(result.canje);
            }
            
            // Cambiar a la vista de mis canjes
            setTimeout(() => {
              this.switchView('my-rewards');
            }, 2000);
          } else {
            this.toastService.showError(result.message);
          }
        },
        error: (error) => {
          console.error('❌ Error canjeando recompensa:', error);
          this.canjeando = false;
          this.toastService.showError('Error al canjear la recompensa');
        }
      })
    );
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
  }

  useRedemption(canje: CanjeRecompensa): void {
    const confirmed = confirm(
      `¿Marcar como usado el canje "${canje.nombreRecompensa}"?\n\n` +
      `Código: ${canje.codigo}`
    );
    
    if (confirmed) {
      this.subscriptions.add(
        this.rewardsService.markRedemptionAsUsed(canje.id).subscribe({
          next: (success) => {
            if (success) {
              this.toastService.showSuccess('Canje marcado como usado');
            } else {
              this.toastService.showError('Error al marcar canje como usado');
            }
          },
          error: (error) => {
            console.error('❌ Error marcando canje como usado:', error);
            this.toastService.showError('Error al marcar canje como usado');
          }
        })
      );
    }
  }

  copyRedemptionCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.toastService.showSuccess('Código copiado al portapapeles');
    }).catch(() => {
      // Fallback para navegadores sin soporte
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.toastService.showSuccess('Código copiado al portapapeles');
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

  isExpired(fechaExpiracion: string): boolean {
    return new Date(fechaExpiracion) <= new Date();
  }

  isActive(canje: CanjeRecompensa): boolean {
    return !canje.usado && !this.isExpired(canje.fechaExpiracion);
  }

  isUsed(canje: CanjeRecompensa): boolean {
    return canje.usado;
  }

  getCanjeStatusClass(canje: CanjeRecompensa): string {
    if (this.isUsed(canje)) return 'bg-secondary';
    if (this.isActive(canje)) return 'bg-success';
    return 'bg-warning'; // Expirado
  }

  getCanjeStatusText(canje: CanjeRecompensa): string {
    if (this.isUsed(canje)) return 'Usado';
    if (this.isActive(canje)) return 'Activo';
    return 'Expirado';
  }

  getCanjeStatusIcon(canje: CanjeRecompensa): string {
    if (this.isUsed(canje)) return 'fas fa-check';
    if (this.isActive(canje)) return 'fas fa-clock';
    return 'fas fa-times';
  }

  canMarkAsUsed(canje: CanjeRecompensa): boolean {
    return !canje.usado && !this.isExpired(canje.fechaExpiracion);
  }

  // ==================== NAVEGACIÓN ====================

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToMovies(): void {
    this.router.navigate(['/movies']);
  }

  goToBar(): void {
    this.router.navigate(['/bar']);
  }

  goToPointsHistory(): void {
    this.router.navigate(['/points-history']);
  }

  // ==================== MÉTODOS DE RECARGA ====================

  refreshData(): void {
    this.cargando = true;
    this.rewardsService.refreshRewards();
    this.loadUserPoints();
    this.toastService.showInfo('Datos actualizados');
  }

  // ==================== HANDLERS DE EVENTOS ====================

  onRewardImageError(event: any): void {
    // Fallback para imágenes que no cargan
    event.target.src = 'assets/recompensas/default.png';
  }

  onModalShow(): void {
    // Acciones cuando se muestra el modal
    console.log('Modal de recompensa mostrado');
  }

  onModalHide(): void {
    // Acciones cuando se oculta el modal
    this.selectedReward = null;
    console.log('Modal de recompensa ocultado');
  }

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  validateRewardAccess(reward: Recompensa): boolean {
    return reward.disponible && reward.stock > 0;
  }

  getValidationMessage(reward: Recompensa): string {
    if (!reward.disponible) {
      return 'Esta recompensa no está disponible';
    }
    
    if (reward.stock <= 0) {
      return 'Esta recompensa está agotada';
    }
    
    if (!this.canAffordReward(reward)) {
      const missing = reward.puntosRequeridos - this.userPoints;
      return `Te faltan ${missing} puntos`;
    }
    
    return 'Recompensa disponible';
  }

  // ==================== MÉTODOS DE ESTADÍSTICAS ====================

  getTotalRedemptions(): number {
    return this.userRedemptions.length;
  }

  getTotalActiveRedemptions(): number {
    return this.activeRedemptions.length;
  }

  getTotalPointsUsed(): number {
    return this.userRedemptions.reduce((total, canje) => total + canje.puntosUsados, 0);
  }

  getMostUsedCategory(): string {
    if (this.userRedemptions.length === 0) return 'Ninguna';
    
    const categoryCounts: { [key: string]: number } = {};
    
    this.userRedemptions.forEach(canje => {
      const reward = this.allRewards.find(r => r.id === canje.recompensaId);
      if (reward) {
        const category = reward.categoria;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    let mostUsedCategory = '';
    let maxCount = 0;
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsedCategory = category;
      }
    });
    
    return this.getCategoryName(mostUsedCategory) || 'Ninguna';
  }

  // ==================== MÉTODOS PARA EXPORTAR DATOS ====================

  exportRedemptionHistory(): void {
    if (this.userRedemptions.length === 0) {
      this.toastService.showWarning('No tienes canjes para exportar');
      return;
    }

    try {
      const csvHeaders = ['Fecha Canje', 'Recompensa', 'Código', 'Puntos Usados', 'Estado', 'Válido Hasta'];
      const csvData = this.userRedemptions.map(canje => [
        this.formatDate(canje.fechaCanje),
        canje.nombreRecompensa,
        canje.codigo,
        canje.puntosUsados.toString(),
        this.getCanjeStatusText(canje),
        this.formatDate(canje.fechaExpiracion)
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historial-canjes-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.toastService.showSuccess('Historial de canjes exportado');
    } catch (error) {
      console.error('Error al exportar:', error);
      this.toastService.showError('Error al exportar el historial');
    }
  }

  // ==================== MÉTODOS DE BÚSQUEDA AVANZADA ====================

  searchRewardsByPoints(maxPoints: number): Recompensa[] {
    return this.allRewards.filter(reward => 
      reward.puntosRequeridos <= maxPoints && reward.disponible && reward.stock > 0
    );
  }

  getRecommendedRewards(): Recompensa[] {
    // Recomendaciones basadas en los puntos actuales y historial
    const affordable = this.searchRewardsByPoints(this.userPoints);
    const mostUsedCategory = this.getMostUsedCategory();
    
    // Priorizar recompensas de la categoría más usada
    const recommended = affordable.filter(reward => 
      this.getCategoryName(reward.categoria) === mostUsedCategory
    );
    
    // Si no hay suficientes, agregar otras recompensas asequibles
    if (recommended.length < 3) {
      const others = affordable.filter(reward => 
        this.getCategoryName(reward.categoria) !== mostUsedCategory
      );
      recommended.push(...others.slice(0, 3 - recommended.length));
    }
    
    return recommended.slice(0, 3);
  }

  // ==================== MÉTODOS DE ANIMACIONES ====================

  animateRewardCard(element: HTMLElement): void {
    element.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
      element.classList.remove('animate__animated', 'animate__pulse');
    }, 1000);
  }

  // ==================== MÉTODOS DE ACCESIBILIDAD ====================

  announceToScreenReader(message: string): void {
    // Para lectores de pantalla
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // ==================== MÉTODOS PARA DEBUGGING ====================

  logRewardsState(): void {
    if (!this.authService.isAdmin()) return;
    
    console.log('=== REWARDS COMPONENT STATE ===');
    console.log('User Points:', this.userPoints);
    console.log('All Rewards:', this.allRewards.length);
    console.log('Filtered Rewards:', this.filteredRewards.length);
    console.log('User Redemptions:', this.userRedemptions.length);
    console.log('Active Redemptions:', this.activeRedemptions.length);
    console.log('Current View:', this.currentView);
    console.log('Filters:', {
      category: this.selectedCategory,
      search: this.searchTerm,
      affordable: this.showOnlyAffordable,
      sort: this.sortBy
    });
    console.log('================================');
  }
}