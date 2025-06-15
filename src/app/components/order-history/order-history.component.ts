import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, Order, OrderDetails, OrderStats } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-order-history',
  standalone: false, // ✅ IMPORTANTE: Debe ser false para usar en app.module.ts
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {

  orders: Order[] = [];
  stats: OrderStats | null = null;
  selectedOrder: OrderDetails | null = null;
  
  // Estados
  loading: boolean = true;
  loadingStats: boolean = true;
  loadingOrderDetails: boolean = false;
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  hasMoreOrders: boolean = false;
  
  // Filtros
  filterStatus: string = 'all';
  filterPaymentMethod: string = 'all';
  showFilters: boolean = false;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadOrders();
    this.loadStats();
  }

  // ==================== CARGAR DATOS ====================

  loadOrders(page: number = 1): void {
    this.loading = true;
    
    this.orderService.getUserOrders(page, this.itemsPerPage).subscribe({
      next: (orders) => {
        if (page === 1) {
          this.orders = orders;
        } else {
          this.orders = [...this.orders, ...orders];
        }
        
        this.hasMoreOrders = orders.length === this.itemsPerPage;
        this.currentPage = page;
        this.loading = false;
        
        console.log(`✅ ${orders.length} órdenes cargadas (página ${page})`);
      },
      error: (error) => {
        console.error('❌ Error cargando órdenes:', error);
        this.loading = false;
        this.toastService.showError('Error al cargar el historial de órdenes');
      }
    });
  }

  loadStats(): void {
    this.loadingStats = true;
    
    this.orderService.getOrderStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loadingStats = false;
        console.log('✅ Estadísticas de órdenes cargadas:', stats);
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
        this.loadingStats = false;
        this.stats = {
          totalOrdenes: 0,
          ordenesCompletadas: 0,
          ordenesPendientes: 0,
          ordenesCanceladas: 0,
          totalIngresos: 0,
          ticketPromedio: 0
        };
      }
    });
  }

  loadMoreOrders(): void {
    if (this.hasMoreOrders && !this.loading) {
      this.loadOrders(this.currentPage + 1);
    }
  }

  // ==================== GESTIÓN DE ÓRDENES ====================

  viewOrderDetails(orderId: string): void {
    this.loadingOrderDetails = true;
    
    this.orderService.getOrderById(orderId).subscribe({
      next: (orderDetails) => {
        this.selectedOrder = orderDetails;
        this.loadingOrderDetails = false;
        
        if (orderDetails) {
          console.log('✅ Detalles de orden cargados:', orderDetails);
          this.showOrderModal();
        } else {
          this.toastService.showError('No se pudieron cargar los detalles de la orden');
        }
      },
      error: (error) => {
        console.error('❌ Error cargando detalles de orden:', error);
        this.loadingOrderDetails = false;
        this.toastService.showError('Error al cargar los detalles de la orden');
      }
    });
  }

  cancelOrder(orderId: string): void {
    if (confirm('¿Estás seguro de que quieres cancelar esta orden?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: (success) => {
          if (success) {
            this.toastService.showSuccess('Orden cancelada exitosamente');
            this.loadOrders(); // Recargar lista
          } else {
            this.toastService.showError('No se pudo cancelar la orden');
          }
        },
        error: (error) => {
          console.error('❌ Error cancelando orden:', error);
          this.toastService.showError('Error al cancelar la orden');
        }
      });
    }
  }

  // ==================== MÉTODOS DE FILTRADO ====================

  getFilteredOrders(): Order[] {
    let filtered = [...this.orders];
    
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(order => order.estado === this.filterStatus);
    }
    
    if (this.filterPaymentMethod !== 'all') {
      filtered = filtered.filter(order => 
        order.metodo_pago.toLowerCase().includes(this.filterPaymentMethod.toLowerCase())
      );
    }
    
    return filtered;
  }

  resetFilters(): void {
    this.filterStatus = 'all';
    this.filterPaymentMethod = 'all';
    this.showFilters = false;
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // ==================== MÉTODOS AUXILIARES ====================

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completada':
        return 'bg-success';
      case 'pendiente':
        return 'bg-warning text-dark';
      case 'cancelada':
        return 'bg-danger';
      case 'reembolsada':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completada':
        return 'Completada';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelada':
        return 'Cancelada';
      case 'reembolsada':
        return 'Reembolsada';
      default:
        return status;
    }
  }

  getPaymentMethodIcon(method: string): string {
    if (method.toLowerCase().includes('paypal')) {
      return 'fab fa-paypal';
    } else if (method.toLowerCase().includes('tarjeta')) {
      return 'fas fa-credit-card';
    } else {
      return 'fas fa-money-bill';
    }
  }

  canCancelOrder(order: Order): boolean {
    return order.estado === 'pendiente';
  }

  getTotalItems(order: Order): number {
    return order.total_entradas + order.total_productos_bar;
  }

  // ==================== MÉTODOS PARA MODAL ====================

  showOrderModal(): void {
    const modalElement = document.getElementById('orderDetailsModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  closeOrderModal(): void {
    const modalElement = document.getElementById('orderDetailsModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.selectedOrder = null;
  }

  // ==================== MÉTODOS PARA ESTADÍSTICAS ====================

  getSuccessRate(): number {
    if (!this.stats || this.stats.totalOrdenes === 0) return 0;
    return Math.round((this.stats.ordenesCompletadas / this.stats.totalOrdenes) * 100);
  }

  getRecentOrdersCount(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.orders.filter(order => 
      new Date(order.fecha_creacion) >= thirtyDaysAgo
    ).length;
  }

  getMostUsedPaymentMethod(): string {
    if (this.orders.length === 0) return 'N/A';
    
    const paymentMethods: { [key: string]: number } = {};
    
    this.orders.forEach(order => {
      const method = order.metodo_pago;
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });
    
    let mostUsed = '';
    let maxCount = 0;
    
    Object.entries(paymentMethods).forEach(([method, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = method;
      }
    });
    
    return mostUsed || 'N/A';
  }

  // ==================== MÉTODOS DE NAVEGACIÓN ====================

  goToMovies(): void {
    this.router.navigate(['/movies']);
  }

  goToBar(): void {
    this.router.navigate(['/bar']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  // ==================== MÉTODO PARA REORDENAR ====================

  reorderItems(order: Order): void {
    // En una implementación real, esto recrearía los items en el carrito
    this.toastService.showInfo('Función de reordenar próximamente disponible');
  }

  // ==================== MÉTODOS PARA EXPORTAR ====================

  exportOrderHistory(): void {
    if (this.orders.length === 0) {
      this.toastService.showWarning('No hay órdenes para exportar');
      return;
    }

    // Crear CSV con la información de las órdenes
    const csvHeaders = ['Fecha', 'Orden ID', 'Estado', 'Método de Pago', 'Items', 'Total'];
    const csvData = this.orders.map(order => [
      this.formatDate(order.fecha_creacion),
      order.id,
      this.getStatusText(order.estado),
      order.metodo_pago,
      this.getTotalItems(order).toString(),
      this.formatCurrency(order.total)
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-ordenes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.toastService.showSuccess('Historial exportado exitosamente');
  }

  // ==================== MÉTODOS PARA DETALLES DE ORDEN ====================

  getOrderItemsDescription(order: OrderDetails): string {
    const items: string[] = [];
    
    if (order.total_entradas > 0) {
      items.push(`${order.total_entradas} entrada(s)`);
    }
    
    if (order.total_productos_bar > 0) {
      items.push(`${order.total_productos_bar} producto(s) del bar`);
    }
    
    return items.join(' + ');
  }

  hasMovieItems(order: OrderDetails): boolean {
    return order.items_peliculas && order.items_peliculas.length > 0;
  }

  hasBarItems(order: OrderDetails): boolean {
    return order.items_bar && order.items_bar.length > 0;
  }

  // ==================== TRACKBY FUNCTIONS ====================

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  // ==================== MÉTODO PARA REFRESCAR DATOS ====================

  refreshData(): void {
    this.currentPage = 1;
    this.loadOrders();
    this.loadStats();
    this.toastService.showInfo('Datos actualizados');
  }
}