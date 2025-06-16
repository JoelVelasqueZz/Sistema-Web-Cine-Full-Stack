import { Component, OnInit } from '@angular/core';
import { RewardsService, Reward, RewardsStats } from '../../../services/rewards.service';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';

declare var bootstrap: any;

@Component({
  selector: 'app-admin-rewards',
  templateUrl: './admin-rewards.component.html',
  styleUrls: ['./admin-rewards.component.css'],
  standalone: false
})
export class AdminRewardsComponent implements OnInit {

  // ==================== PROPIEDADES ====================
  rewards: Reward[] = [];
  filteredRewards: Reward[] = [];
  categories: string[] = [];
  rewardsStats: RewardsStats = {
    totalRecompensas: 0,
    recompensasActivas: 0,
    totalCanjes: 0,
    puntosCanjeados: 0,
    categoriaPopular: '',
    recompensaPopular: ''
  };
  
  // Estados de UI
  loading = false;
  showForm = false;
  editMode = false;
  
  // Filtros y búsqueda
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  // Formulario
  rewardForm: Partial<Reward> = {
    nombre: '',
    descripcion: '',
    categoria: 'peliculas',
    tipo: 'descuento',
    puntos_requeridos: 0,
    valor: 0,
    stock: 0,
    limite_por_usuario: 1,
    validez_dias: 30,
    imagen_url: '',
    disponible: true
  };
  
  // Validación
  formErrors: { [key: string]: string } = {};
  
  // Configuraciones
  readonly CATEGORIAS = [
    { value: 'peliculas', label: 'Películas', icon: 'fas fa-film' },
    { value: 'bar', label: 'Bar & Comida', icon: 'fas fa-utensils' },
    { value: 'especial', label: 'Especiales', icon: 'fas fa-star' },
    { value: 'descuentos', label: 'Descuentos', icon: 'fas fa-percent' }
  ];
  
  readonly TIPOS = [
    { value: 'descuento', label: 'Descuento %', icon: 'fas fa-percent' },
    { value: 'producto', label: 'Producto Gratis', icon: 'fas fa-gift' },
    { value: 'paquete', label: 'Paquete Especial', icon: 'fas fa-box' },
    { value: 'experiencia', label: 'Experiencia VIP', icon: 'fas fa-crown' },
    { value: 'codigo', label: 'Código Promocional', icon: 'fas fa-ticket-alt' },
    { value: 'bonus', label: 'Bonus Extra', icon: 'fas fa-plus-circle' }
  ];

  constructor(
    private rewardsService: RewardsService,
    private adminService: AdminService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkAdminAccess();
    this.loadData();
  }

  // ==================== TRACK BY FUNCTIONS ====================
  
  trackByRewardId(index: number, reward: Reward): number {
    return reward.id || index;
  }

  // ==================== VERIFICACIÓN DE ACCESO ====================
  
  private checkAdminAccess(): void {
    if (!this.authService.isAdmin()) {
      // 🔧 CORREGIDO: Solo mensaje sin título
      this.toastService.showError('Acceso denegado: No tienes permisos de administrador');
      return;
    }
  }

  // ==================== CARGA DE DATOS ====================
  
  private async loadData(): Promise<void> {
    this.loading = true;
    
    try {
      await Promise.all([
        this.loadRewards(),
        this.loadCategories(),
        this.loadStats()
      ]);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      // 🔧 CORREGIDO: Solo mensaje
      this.toastService.showError('No se pudieron cargar los datos');
    } finally {
      this.loading = false;
    }
  }
  
  private async loadRewards(): Promise<void> {
    try {
      this.rewardsService.getAllRewards().subscribe({
        next: (rewards: Reward[]) => {
          this.rewards = rewards;
          this.applyFilters();
        },
        error: (error: any) => {
          console.error('❌ Error cargando recompensas:', error);
          // 🔧 CORREGIDO: Solo mensaje
          this.toastService.showError('No se pudieron cargar las recompensas');
        }
      });
    } catch (error) {
      console.error('❌ Error en loadRewards:', error);
    }
  }
  
  private async loadCategories(): Promise<void> {
    try {
      this.rewardsService.getCategories().subscribe({
        next: (categories: string[]) => {
          this.categories = categories;
        },
        error: (error: any) => {
          console.error('❌ Error cargando categorías:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error en loadCategories:', error);
    }
  }
  
  private async loadStats(): Promise<void> {
    try {
      this.rewardsService.getRewardsStats().subscribe({
        next: (stats: RewardsStats) => {
          this.rewardsStats = stats;
        },
        error: (error: any) => {
          console.error('❌ Error cargando estadísticas:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error en loadStats:', error);
    }
  }

  // ==================== FILTROS Y BÚSQUEDA ====================
  
  applyFilters(): void {
    let filtered = [...this.rewards];
    
    // Filtro por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(reward => 
        reward.nombre.toLowerCase().includes(term) ||
        reward.descripcion.toLowerCase().includes(term)
      );
    }
    
    // Filtro por categoría
    if (this.selectedCategory) {
      filtered = filtered.filter(reward => reward.categoria === this.selectedCategory);
    }
    
    // Filtro por estado
    if (this.selectedStatus === 'disponible') {
      filtered = filtered.filter(reward => reward.disponible);
    } else if (this.selectedStatus === 'no_disponible') {
      filtered = filtered.filter(reward => !reward.disponible);
    } else if (this.selectedStatus === 'sin_stock') {
      filtered = filtered.filter(reward => reward.stock !== null && reward.stock !== undefined && reward.stock <= 0);
    }
    
    this.filteredRewards = filtered;
    this.updatePagination();
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  // ==================== PAGINACIÓN ====================
  
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRewards.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }
  
  getPaginatedRewards(): Reward[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredRewards.slice(startIndex, endIndex);
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // ==================== GESTIÓN DEL FORMULARIO ====================
  
  openCreateForm(): void {
    this.resetForm();
    this.editMode = false;
    this.showForm = true;
    this.openModal('rewardFormModal');
  }
  
  openEditForm(reward: Reward): void {
    this.rewardForm = { ...reward };
    this.editMode = true;
    this.showForm = true;
    this.openModal('rewardFormModal');
  }
  
  private resetForm(): void {
    this.rewardForm = {
      nombre: '',
      descripcion: '',
      categoria: 'peliculas',
      tipo: 'descuento',
      puntos_requeridos: 0,
      valor: 0,
      stock: 0,
      limite_por_usuario: 1,
      validez_dias: 30,
      imagen_url: '',
      disponible: true
    };
    this.formErrors = {};
  }
  
  closeForm(): void {
    this.showForm = false;
    this.resetForm();
    this.closeModal('rewardFormModal');
  }

  // ==================== VALIDACIÓN ====================
  
  private validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;
    
    // Nombre
    if (!this.rewardForm.nombre?.trim()) {
      this.formErrors['nombre'] = 'El nombre es obligatorio';
      isValid = false;
    } else if (this.rewardForm.nombre.length < 3) {
      this.formErrors['nombre'] = 'El nombre debe tener al menos 3 caracteres';
      isValid = false;
    }
    
    // Descripción
    if (!this.rewardForm.descripcion?.trim()) {
      this.formErrors['descripcion'] = 'La descripción es obligatoria';
      isValid = false;
    } else if (this.rewardForm.descripcion.length < 10) {
      this.formErrors['descripcion'] = 'La descripción debe tener al menos 10 caracteres';
      isValid = false;
    }
    
    // Puntos requeridos
    if (!this.rewardForm.puntos_requeridos || this.rewardForm.puntos_requeridos <= 0) {
      this.formErrors['puntos_requeridos'] = 'Los puntos requeridos deben ser mayor a 0';
      isValid = false;
    }
    
    // Valor (para descuentos y productos)
    if (this.needsValue() && (!this.rewardForm.valor || this.rewardForm.valor <= 0)) {
      this.formErrors['valor'] = 'El valor debe ser mayor a 0';
      isValid = false;
    }
    
    // Stock (si es aplicable)
    if (this.needsStock() && (this.rewardForm.stock === null || this.rewardForm.stock === undefined || this.rewardForm.stock < 0)) {
      this.formErrors['stock'] = 'El stock debe ser 0 o mayor';
      isValid = false;
    }
    
    return isValid;
  }
  
  needsValue(): boolean {
    return ['descuento', 'producto', 'paquete'].includes(this.rewardForm.tipo || '');
  }
  
  needsStock(): boolean {
    return ['producto', 'paquete', 'experiencia'].includes(this.rewardForm.tipo || '');
  }

  // ==================== OPERACIONES CRUD ====================
  
  async saveReward(): Promise<void> {
    if (!this.validateForm()) {
      // 🔧 CORREGIDO: Solo mensaje
      this.toastService.showError('Por favor corrige los errores en el formulario');
      return;
    }
    
    this.loading = true;
    
    try {
      if (this.editMode && this.rewardForm.id) {
        // Actualizar recompensa existente
        this.rewardsService.updateReward(this.rewardForm.id, this.rewardForm).subscribe({
          next: (success: boolean) => {
            if (success) {
              // 🔧 CORREGIDO: Solo mensaje
              this.toastService.showSuccess('Recompensa actualizada correctamente');
              this.closeForm();
              this.loadRewards();
            } else {
              this.toastService.showError('No se pudo actualizar la recompensa');
            }
          },
          error: (error: any) => {
            console.error('❌ Error actualizando recompensa:', error);
            this.toastService.showError('Error al actualizar la recompensa');
          },
          complete: () => {
            this.loading = false;
          }
        });
      } else {
        // Crear nueva recompensa
        this.rewardsService.createReward(this.rewardForm).subscribe({
          next: (success: boolean) => {
            if (success) {
              this.toastService.showSuccess('Recompensa creada correctamente');
              this.closeForm();
              this.loadRewards();
            } else {
              this.toastService.showError('No se pudo crear la recompensa');
            }
          },
          error: (error: any) => {
            console.error('❌ Error creando recompensa:', error);
            this.toastService.showError('Error al crear la recompensa');
          },
          complete: () => {
            this.loading = false;
          }
        });
      }
    } catch (error) {
      console.error('❌ Error en saveReward:', error);
      this.toastService.showError('Error inesperado al guardar');
      this.loading = false;
    }
  }
  
  confirmDelete(reward: Reward): void {
    if (confirm(`¿Estás seguro de que quieres eliminar la recompensa "${reward.nombre}"?`)) {
      this.deleteReward(reward.id!);
    }
  }
  
  private deleteReward(rewardId: number): void {
    this.loading = true;
    
    this.rewardsService.deleteReward(rewardId).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.toastService.showSuccess('Recompensa eliminada correctamente');
          this.loadRewards();
        } else {
          this.toastService.showError('No se pudo eliminar la recompensa');
        }
      },
      error: (error: any) => {
        console.error('❌ Error eliminando recompensa:', error);
        this.toastService.showError('Error al eliminar la recompensa');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  toggleRewardStatus(reward: Reward): void {
    const newStatus = !reward.disponible;
    const updatedReward = { ...reward, disponible: newStatus };
    
    this.rewardsService.updateReward(reward.id!, updatedReward).subscribe({
      next: (success: boolean) => {
        if (success) {
          reward.disponible = newStatus;
          this.toastService.showSuccess(
            `Recompensa ${newStatus ? 'activada' : 'desactivada'} correctamente`
          );
        } else {
          this.toastService.showError('No se pudo cambiar el estado');
        }
      },
      error: (error: any) => {
        console.error('❌ Error cambiando estado:', error);
        this.toastService.showError('Error al cambiar el estado');
      }
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================
  
  getCategoryIcon(categoria: string): string {
    const cat = this.CATEGORIAS.find(c => c.value === categoria);
    return cat ? cat.icon : 'fas fa-tag';
  }
  
  getTipoIcon(tipo: string): string {
    const t = this.TIPOS.find(t => t.value === tipo);
    return t ? t.icon : 'fas fa-question';
  }
  
  getCategoryLabel(categoria: string): string {
    const cat = this.CATEGORIAS.find(c => c.value === categoria);
    return cat ? cat.label : categoria;
  }
  
  getTipoLabel(tipo: string): string {
    const t = this.TIPOS.find(t => t.value === tipo);
    return t ? t.label : tipo;
  }
  
  getStatusBadgeClass(reward: Reward): string {
    if (!reward.disponible) {
      return 'bg-danger';
    } else if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
      return 'bg-warning text-dark';
    }
    return 'bg-success';
  }
  
  getStatusText(reward: Reward): string {
    if (!reward.disponible) {
      return 'Inactiva';
    } else if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
      return 'Sin Stock';
    }
    return 'Activa';
  }
  
  private openModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }
  
  private closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }
  
  refreshData(): void {
    this.loadData();
  }

  // Método auxiliar para Math.min que usa el HTML
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }
}