import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PointsService } from '../../services/points.service';
import { RewardsService, Reward, RedemptionCode } from '../../services/rewards.service';
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
  allRewards: Reward[] = [];
  filteredRewards: Reward[] = [];
  categories: string[] = [];
  
  // Filtros
  selectedCategory: string = 'todas';
  sortBy: string = 'puntos-asc';
  searchTerm: string = '';
  showOnlyAffordable: boolean = false;
  
  // Canjes del usuario
  userRedemptions: RedemptionCode[] = [];
  activeRedemptions: RedemptionCode[] = [];
  
  // Vista actual
  currentView: 'catalog' | 'my-rewards' = 'catalog';
  
  // Recompensa seleccionada para modal
  selectedReward: Reward | null = null;
  
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
      this.toastService.showError('Debes iniciar sesión para ver las recompensas');
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
    this.subscriptions.add(
      this.rewardsService.getAllRewards().subscribe({
        next: (rewards) => {
          this.allRewards = rewards;
          this.applyFilters();
          this.cargando = false;
          console.log('✅ Recompensas cargadas:', rewards.length);
        },
        error: (error) => {
          console.error('❌ Error cargando recompensas:', error);
          this.cargando = false;
          this.toastService.showError('Error al cargar las recompensas');
        }
      })
    );
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
    this.subscriptions.add(
      this.rewardsService.getUserRedemptions().subscribe({
        next: (redemptions) => {
          this.userRedemptions = redemptions;
          this.activeRedemptions = redemptions.filter(r => !r.usado && !this.isExpired(r.fecha_vencimiento));
          console.log('✅ Canjes del usuario cargados:', redemptions.length);
        },
        error: (error) => {
          console.error('❌ Error cargando canjes:', error);
        }
      })
    );
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
      filtered = filtered.filter(reward => reward.puntos_requeridos <= this.userPoints);
    }

    // Solo mostrar recompensas disponibles
    filtered = filtered.filter(reward => reward.disponible);

    // Ordenamiento
    switch (this.sortBy) {
      case 'puntos-asc':
        filtered.sort((a, b) => a.puntos_requeridos - b.puntos_requeridos);
        break;
      case 'puntos-desc':
        filtered.sort((a, b) => b.puntos_requeridos - a.puntos_requeridos);
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
  
  canAffordReward(reward: Reward): boolean {
    return this.userPoints >= reward.puntos_requeridos;
  }

  openRewardModal(reward: Reward): void {
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
      `¿Estás seguro de canjear "${this.selectedReward.nombre}" por ${this.selectedReward.puntos_requeridos} puntos?\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (confirmation) {
      this.redeemReward(this.selectedReward);
    }
  }

  redeemReward(reward: Reward): void {
    this.canjeando = true;
    
    this.subscriptions.add(
      this.rewardsService.redeemReward(reward.id!).subscribe({
        next: (result) => {
          this.canjeando = false;
          
          if (result.success) {
            this.toastService.showSuccess(result.message);
            
            // Cerrar modal
            this.closeRewardModal();
            
            // Mostrar información del canje
            if (result.codigo) {
              this.showRedemptionDetails(result.codigo);
            }
            
            // Recargar datos
            this.loadUserPoints();
            this.loadUserRedemptions();
            
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

  showRedemptionDetails(codigo: string): void {
    const message = `¡Canje exitoso!\n\n` +
                   `Código: ${codigo}\n\n` +
                   `Guarda este código para usar tu recompensa.`;
    
    setTimeout(() => {
      alert(message);
    }, 500);
  }

  // ==================== MÉTODOS DE VISTA ====================
  
  switchView(view: 'catalog' | 'my-rewards'): void {
    this.currentView = view;
  }

  useRedemption(canje: RedemptionCode): void {
    const confirmed = confirm(
      `¿Marcar como usado el canje "${canje.recompensa.nombre}"?\n\n` +
      `Código: ${canje.codigo}`
    );
    
    if (confirmed) {
      this.subscriptions.add(
        this.rewardsService.markCodeAsUsed(canje.codigo).subscribe({
          next: (result) => {
            if (result.success) {
              this.toastService.showSuccess('Canje marcado como usado');
              this.loadUserRedemptions(); // Recargar canjes
            } else {
              this.toastService.showError(result.message);
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

  getRedeemButtonText(reward: Reward): string {
    if (!this.canAffordReward(reward)) {
      const missing = reward.puntos_requeridos - this.userPoints;
      return `Faltan ${missing} puntos`;
    }
    
    if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
      return 'Agotado';
    }
    
    return `Canjear por ${reward.puntos_requeridos} puntos`;
  }

  isRedeemButtonDisabled(reward: Reward): boolean {
    return !this.canAffordReward(reward) || 
           (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) || 
           this.canjeando ||
           !reward.disponible;
  }

  getProgressToReward(reward: Reward): number {
    if (this.userPoints >= reward.puntos_requeridos) return 100;
    return Math.round((this.userPoints / reward.puntos_requeridos) * 100);
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

  isActive(canje: RedemptionCode): boolean {
    return !canje.usado && !this.isExpired(canje.fecha_vencimiento);
  }

  isUsed(canje: RedemptionCode): boolean {
    return canje.usado;
  }

  getCanjeStatusClass(canje: RedemptionCode): string {
    if (this.isUsed(canje)) return 'bg-secondary';
    if (this.isActive(canje)) return 'bg-success';
    return 'bg-warning'; // Expirado
  }

  getCanjeStatusText(canje: RedemptionCode): string {
    if (this.isUsed(canje)) return 'Usado';
    if (this.isActive(canje)) return 'Activo';
    return 'Expirado';
  }

  getCanjeStatusIcon(canje: RedemptionCode): string {
    if (this.isUsed(canje)) return 'fas fa-check';
    if (this.isActive(canje)) return 'fas fa-clock';
    return 'fas fa-times';
  }

  canMarkAsUsed(canje: RedemptionCode): boolean {
    return !canje.usado && !this.isExpired(canje.fecha_vencimiento);
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
    this.loadRewards();
    this.loadUserPoints();
    this.loadUserRedemptions();
    this.toastService.showSuccess('Datos actualizados');
  }

  // ==================== MÉTODOS DE VALIDACIÓN ====================
  
  validateRewardAccess(reward: Reward): boolean {
    return reward.disponible && 
           (reward.stock === null || reward.stock === undefined || reward.stock > 0);
  }

  getValidationMessage(reward: Reward): string {
    if (!reward.disponible) {
      return 'Esta recompensa no está disponible';
    }
    
    if (reward.stock !== undefined && reward.stock !== null && reward.stock <= 0) {
      return 'Esta recompensa está agotada';
    }
    
    if (!this.canAffordReward(reward)) {
      const missing = reward.puntos_requeridos - this.userPoints;
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
    // Como no tenemos el campo puntosUsados en RedemptionCode, 
    // calculamos basándome en la recompensa asociada
    return this.userRedemptions.reduce((total, canje) => {
      const reward = this.allRewards.find(r => r.id === canje.recompensa.id);
      return total + (reward ? reward.puntos_requeridos : 0);
    }, 0);
  }

  getMostUsedCategory(): string {
    if (this.userRedemptions.length === 0) return 'Ninguna';
    
    const categoryCounts: { [key: string]: number } = {};
    
    this.userRedemptions.forEach(canje => {
      const category = canje.recompensa.categoria;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
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

  // ==================== MÉTODOS DE BÚSQUEDA AVANZADA ====================
  
  searchRewardsByPoints(maxPoints: number): Reward[] {
    return this.allRewards.filter(reward => 
      reward.puntos_requeridos <= maxPoints && 
      reward.disponible && 
      (reward.stock === undefined || reward.stock === null || reward.stock > 0)
    );
  }

  getRecommendedRewards(): Reward[] {
    const affordable = this.searchRewardsByPoints(this.userPoints);
    return affordable.slice(0, 3);
  }

  // ==================== MÉTODOS DE ACCESIBILIDAD ====================
  
  announceToScreenReader(message: string): void {
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

  // ==================== MÉTODOS AUXILIARES PARA RECOMPENSAS - NUEVOS ====================

  /**
   * Formatea el valor de una recompensa de manera segura
   * @param valor - El valor opcional de la recompensa
   * @returns String formateado con el valor o mensaje alternativo
   */
  getFormattedValue(valor?: number): string {
    if (valor === null || valor === undefined || valor <= 0) {
      return 'Sin valor específico';
    }
    return `$${valor.toFixed(2)}`;
  }

  /**
   * Obtiene el valor formateado con validación de tipo
   * @param reward - La recompensa
   * @returns String con el valor formateado
   */
  getRewardValue(reward: Reward): string {
    return this.getFormattedValue(reward.valor);
  }

  /**
   * Verifica si una recompensa tiene valor monetario válido
   * @param reward - La recompensa a verificar
   * @returns true si tiene valor válido
   */
  hasValidValue(reward: Reward): boolean {
    return reward.valor !== null && 
           reward.valor !== undefined && 
           reward.valor > 0;
  }

  /**
   * Obtiene el valor en texto para mostrar en el template
   * @param valor - Valor opcional de la recompensa
   * @returns String para mostrar
   */
  getValueDisplay(valor?: number): string {
    if (!this.hasValidValue({ valor } as Reward)) {
      return ''; // Retorna vacío para ocultar la sección
    }
    return this.getFormattedValue(valor);
  }

  /**
   * Verifica si debe mostrar la sección de valor
   * @param reward - La recompensa
   * @returns true si debe mostrar la sección
   */
  shouldShowValue(reward: Reward): boolean {
    return this.hasValidValue(reward);
  }

  /**
   * Obtiene un valor numérico seguro
   * @param valor - Valor que puede ser undefined/null
   * @returns Número válido o 0
   */
  getSafeNumber(valor?: number): number {
    return valor || 0;
  }

  /**
   * Maneja errores de imagen de recompensa
   * @param event - Evento de error de imagen
   */
  onRewardImageError(event: any): void {
    // Usar una imagen placeholder SVG inline
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIiBzdHJva2U9IiNkZWUyZTYiIHN0cm9rZS13aWR0aD0iMSIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEwMCwgMTAwKSI+PHJlY3QgeD0iLTQwIiB5PSItMjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2U5ZWNlZiIgc3Ryb2tlPSIjNmM3NTdkIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSItNDAiIHk9Ii01IiB3aWR0aD0iODAiIGhlaWdodD0iMTAiIGZpbGw9IiMyOGE3NDUiLz48cmVjdCB4PSItNSIgeT0iLTQwIiB3aWR0aD0iMTAiIGhlaWdodD0iODAiIGZpbGw9IiMyOGE3NDUiLz48Y2lyY2xlIGN4PSItMTUiIGN5PSItMzAiIHI9IjgiIGZpbGw9IiMyMGM5OTciLz48Y2lyY2xlIGN4PSIxNSIgY3k9Ii0zMCIgcj0iOCIgZmlsbD0iIzIwYzk5NyIvPjxjaXJjbGUgY3g9IjAiIGN5PSItMzAiIHI9IjUiIGZpbGw9IiMxOTg3NTQiLz48L2c+PHRleHQgeD0iNTAlIiB5PSIxNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2VuIG5vIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';
  }

  /**
   * Obtiene las clases CSS para el estado de la recompensa
   * @param reward - La recompensa
   * @returns String con las clases CSS
   */
  getRewardCardClasses(reward: Reward): string {
    const classes = ['card', 'h-100', 'shadow-lg', 'border-0'];
    
    if (this.canAffordReward(reward) && this.validateRewardAccess(reward)) {
      classes.push('border-success');
    } else if (!this.canAffordReward(reward) && this.validateRewardAccess(reward)) {
      classes.push('border-warning');
    } else {
      classes.push('border-danger');
    }
    
    return classes.join(' ');
  }

  /**
   * Obtiene el texto del badge de puntos
   * @param reward - La recompensa
   * @returns String con el texto del badge
   */
  getPointsBadgeText(reward: Reward): string {
    if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
      return 'Agotado';
    }
    return `${reward.puntos_requeridos} puntos`;
  }

  /**
   * Obtiene las clases CSS para el badge de puntos
   * @param reward - La recompensa
   * @returns String con las clases CSS
   */
  getPointsBadgeClasses(reward: Reward): string {
    if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
      return 'badge bg-danger text-white fs-6 px-3 py-2';
    }
    
    if (this.canAffordReward(reward)) {
      return 'badge bg-success text-white fs-6 px-3 py-2';
    }
    
    return 'badge bg-warning text-dark fs-6 px-3 py-2';
  }

  /**
   * Formatea el stock de manera segura
   * @param stock - Stock de la recompensa
   * @returns String formateado
   */
  getFormattedStock(stock?: number | null): string {
    if (stock === null || stock === undefined) {
      return 'Sin límite';
    }
    return stock.toString();
  }

  /**
   * Verifica si una recompensa está en stock bajo
   * @param reward - La recompensa
   * @returns true si el stock es bajo
   */
  isLowStock(reward: Reward): boolean {
    return reward.stock !== null && 
           reward.stock !== undefined && 
           reward.stock <= 10 && 
           reward.stock > 0;
  }

  /**
   * Obtiene el mensaje de stock bajo
   * @param reward - La recompensa
   * @returns String con el mensaje
   */
  getLowStockMessage(reward: Reward): string {
    if (!this.isLowStock(reward)) return '';
    return `¡Solo ${reward.stock} disponibles!`;
  }

  /**
   * Calcula el ahorro en dólares de los puntos
   * @param puntos - Cantidad de puntos
   * @returns Valor en dólares
   */
  getPointsValueInDollars(puntos: number): number {
    // Asumiendo que 100 puntos = $1
    return puntos / 100;
  }

  /**
   * Obtiene el texto de ahorro para mostrar
   * @param reward - La recompensa
   * @returns String con el ahorro
   */
  getSavingsText(reward: Reward): string {
    if (!this.hasValidValue(reward)) return '';
    
    const pointsValue = this.getPointsValueInDollars(reward.puntos_requeridos);
    const actualValue = reward.valor!;
    
    if (actualValue > pointsValue) {
      const savings = actualValue - pointsValue;
      return `¡Ahorras ${savings.toFixed(2)}!`;
    }
    
    return '';
  }

  /**
   * Verifica si hay ahorro en la recompensa
   * @param reward - La recompensa
   * @returns true si hay ahorro
   */
  hasSavings(reward: Reward): boolean {
    if (!this.hasValidValue(reward)) return false;
    
    const pointsValue = this.getPointsValueInDollars(reward.puntos_requeridos);
    return reward.valor! > pointsValue;
  }
}