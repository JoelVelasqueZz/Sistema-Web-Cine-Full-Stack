import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {

  // Datos de usuarios
  allUsers: Usuario[] = [];
  filteredUsers: Usuario[] = [];
  selectedUserDetails: Usuario | null = null;

  // Estados de carga
  loading: boolean = true;
  processing: boolean = false;

  // Filtros
  searchTerm: string = '';
  roleFilter: string = '';
  statusFilter: string = '';
  sortBy: string = 'nombre';

  // Selección múltiple
  selectedUsers: number[] = [];
  selectAll: boolean = false;

  // Usuario actual (no puede modificarse a sí mismo)
  currentUserId: number;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private userService: UserService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.currentUserId = this.authService.getCurrentUser()?.id || 0;
  }

  ngOnInit(): void {
    // Verificar permisos de admin
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para acceder a esta sección');
      this.router.navigate(['/home']);
      return;
    }

    this.loadUsers();
  }

  // ==================== CARGA DE DATOS ====================

  /**
   * Cargar lista de usuarios
   */
  loadUsers(): void {
    this.loading = true;
    
    setTimeout(() => {
      try {
        this.allUsers = this.adminService.getAllUsers();
        this.applyFilters();
        this.loading = false;
        
        console.log('Usuarios cargados:', this.allUsers.length);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        this.toastService.showError('Error al cargar la lista de usuarios');
        this.loading = false;
      }
    }, 1000);
  }

  /**
   * Refrescar datos
   */
  refreshData(): void {
    this.clearSelection();
    this.loadUsers();
    this.toastService.showInfo('Actualizando lista de usuarios...');
  }

  // ==================== FILTROS Y BÚSQUEDA ====================

  /**
   * Aplicar filtros a la lista de usuarios
   */
  applyFilters(): void {
    let filtered = [...this.allUsers];

    // Filtro por búsqueda (nombre o email)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.nombre.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    // Filtro por rol
    if (this.roleFilter) {
      filtered = filtered.filter(user => user.role === this.roleFilter);
    }

    // Filtro por estado
    if (this.statusFilter !== '') {
      const isActive = this.statusFilter === 'true';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'fechaRegistro':
          return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
        case 'role':
          return a.role.localeCompare(b.role);
        default:
          return 0;
      }
    });

    this.filteredUsers = filtered;
    this.clearSelection();
  }

  /**
   * Limpiar todos los filtros
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.sortBy = 'nombre';
    this.applyFilters();
  }

  /**
   * Verificar si hay filtros activos
   */
  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' || 
           this.roleFilter !== '' || 
           this.statusFilter !== '';
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener total de usuarios
   */
  getTotalUsers(): number {
    return this.allUsers.length;
  }

  /**
   * Obtener usuarios activos
   */
  getActiveUsers(): number {
    return this.allUsers.filter(user => user.isActive).length;
  }

  /**
   * Obtener usuarios admin
   */
  getAdminUsers(): number {
    return this.allUsers.filter(user => user.role === 'admin').length;
  }

  /**
   * Obtener usuarios registrados en últimos 30 días
   */
  getRecentUsers(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.allUsers.filter(user => 
      new Date(user.fechaRegistro) >= thirtyDaysAgo
    ).length;
  }

  /**
   * Obtener favoritas del usuario
   */
  getUserFavorites(userId: number): number {
    return this.userService.getUserFavorites(userId).length;
  }

  /**
   * Obtener historial del usuario
   */
  getUserHistory(userId: number): number {
    return this.userService.getUserHistory(userId).length;
  }

  // ==================== GESTIÓN DE USUARIOS ====================

  /**
   * Cambiar rol de usuario
   */
  toggleUserRole(user: Usuario): void {
    if (user.id === this.currentUserId) {
      this.toastService.showWarning('No puedes cambiar tu propio rol');
      return;
    }

    if (this.processing) return;

    const nuevoRol = user.role === 'admin' ? 'cliente' : 'admin';
    const confirmar = confirm(
      `¿Estás seguro de cambiar el rol de "${user.nombre}" a ${nuevoRol}?`
    );

    if (confirmar) {
      this.processing = true;
      
      setTimeout(() => {
        const exito = this.adminService.changeUserRole(user.id, nuevoRol);
        
        if (exito) {
          user.role = nuevoRol;
          this.toastService.showSuccess(`Rol de ${user.nombre} cambiado a ${nuevoRol}`);
        } else {
          this.toastService.showError('Error al cambiar el rol del usuario');
        }
        
        this.processing = false;
      }, 1000);
    }
  }

  /**
   * Cambiar estado de usuario (activo/inactivo)
   */
  toggleUserStatus(user: Usuario): void {
    if (user.id === this.currentUserId) {
      this.toastService.showWarning('No puedes desactivar tu propia cuenta');
      return;
    }

    if (this.processing) return;

    const nuevoEstado = !user.isActive;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    const confirmar = confirm(
      `¿Estás seguro de ${accion} la cuenta de "${user.nombre}"?`
    );

    if (confirmar) {
      this.processing = true;
      
      setTimeout(() => {
        const exito = this.adminService.toggleUserStatus(user.id);
        
        if (exito) {
          user.isActive = nuevoEstado;
          this.toastService.showSuccess(`Usuario ${user.nombre} ${nuevoEstado ? 'activado' : 'desactivado'}`);
        } else {
          this.toastService.showError(`Error al ${accion} el usuario`);
        }
        
        this.processing = false;
      }, 1000);
    }
  }

  /**
   * Ver detalles del usuario
   */
  viewUserDetails(user: Usuario): void {
    this.selectedUserDetails = user;
    
    // Abrir modal (usando Bootstrap)
    const modal = document.getElementById('userDetailsModal');
    if (modal && (window as any).bootstrap) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  /**
   * Editar usuario
   */
  editUser(user: Usuario): void {
    this.toastService.showInfo(`Función de edición para ${user.nombre} (próximamente disponible)`);
    console.log('Editando usuario:', user);
    // TODO: Implementar modal de edición
  }

  /**
   * Enviar email al usuario
   */
  sendEmailToUser(user: Usuario): void {
    if (this.processing) return;

    this.processing = true;
    this.toastService.showInfo(`Enviando email a ${user.nombre}...`);
    
    setTimeout(() => {
      // Simular envío de email
      this.toastService.showSuccess(`Email enviado exitosamente a ${user.email}`);
      this.processing = false;
      
      console.log('Email enviado a:', user);
    }, 2000);
  }

  /**
   * Confirmar eliminación de usuario
   */
  confirmDeleteUser(user: Usuario): void {
    if (user.id === this.currentUserId) {
      this.toastService.showWarning('No puedes eliminar tu propia cuenta');
      return;
    }

    const confirmar = confirm(
      `¿Estás seguro de eliminar al usuario "${user.nombre}"?\n\n` +
      `Esta acción no se puede deshacer y eliminará:\n` +
      `- Todos sus datos personales\n` +
      `- Su historial de favoritas\n` +
      `- Su historial de compras\n\n` +
      `¿Continuar?`
    );

    if (confirmar) {
      this.deleteUser(user);
    }
  }

  /**
   * Eliminar usuario
   */
  private deleteUser(user: Usuario): void {
    this.processing = true;
    this.toastService.showInfo(`Eliminando usuario ${user.nombre}...`);
    
    setTimeout(() => {
      // Simular eliminación
      const index = this.allUsers.findIndex(u => u.id === user.id);
      if (index !== -1) {
        this.allUsers.splice(index, 1);
        this.applyFilters();
        this.toastService.showSuccess(`Usuario ${user.nombre} eliminado exitosamente`);
      } else {
        this.toastService.showError('Error al eliminar el usuario');
      }
      
      this.processing = false;
    }, 2000);
  }

  // ==================== SELECCIÓN MÚLTIPLE ====================

  /**
   * Verificar si un usuario está seleccionado
   */
  isUserSelected(userId: number): boolean {
    return this.selectedUsers.includes(userId);
  }

  /**
   * Toggle selección de usuario
   */
  toggleUserSelection(userId: number): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index === -1) {
      this.selectedUsers.push(userId);
    } else {
      this.selectedUsers.splice(index, 1);
    }
    
    // Actualizar estado de "seleccionar todos"
    this.updateSelectAllState();
  }

  /**
   * Toggle seleccionar todos
   */
  toggleSelectAll(): void {
    if (this.selectAll) {
      // Seleccionar todos (excepto el usuario actual)
      this.selectedUsers = this.filteredUsers
        .filter(user => user.id !== this.currentUserId)
        .map(user => user.id);
    } else {
      // Deseleccionar todos
      this.selectedUsers = [];
    }
  }

  /**
   * Actualizar estado de "seleccionar todos"
   */
  private updateSelectAllState(): void {
    const selectableUsers = this.filteredUsers.filter(user => user.id !== this.currentUserId);
    this.selectAll = selectableUsers.length > 0 && 
                    selectableUsers.every(user => this.isUserSelected(user.id));
  }

  /**
   * Limpiar selección
   */
  clearSelection(): void {
    this.selectedUsers = [];
    this.selectAll = false;
  }

  // ==================== ACCIONES MASIVAS ====================

  /**
   * Cambio masivo de rol
   */
  bulkChangeRole(newRole: 'admin' | 'cliente'): void {
    if (this.selectedUsers.length === 0) return;

    const confirmar = confirm(
      `¿Estás seguro de cambiar el rol de ${this.selectedUsers.length} usuario(s) a ${newRole}?`
    );

    if (confirmar) {
      this.processing = true;
      let successCount = 0;

      this.selectedUsers.forEach(userId => {
        const success = this.adminService.changeUserRole(userId, newRole);
        if (success) {
          const user = this.allUsers.find(u => u.id === userId);
          if (user) {
            user.role = newRole;
            successCount++;
          }
        }
      });

      this.toastService.showSuccess(`${successCount} usuario(s) cambiados a ${newRole}`);
      this.clearSelection();
      this.processing = false;
    }
  }

  /**
   * Activación/desactivación masiva
   */
  bulkActivate(activate: boolean): void {
    if (this.selectedUsers.length === 0) return;

    const action = activate ? 'activar' : 'desactivar';
    const confirmar = confirm(
      `¿Estás seguro de ${action} ${this.selectedUsers.length} usuario(s)?`
    );

    if (confirmar) {
      this.processing = true;
      let successCount = 0;

      this.selectedUsers.forEach(userId => {
        const user = this.allUsers.find(u => u.id === userId);
        if (user && user.isActive !== activate) {
          const success = this.adminService.toggleUserStatus(userId);
          if (success) {
            user.isActive = activate;
            successCount++;
          }
        }
      });

      this.toastService.showSuccess(`${successCount} usuario(s) ${activate ? 'activados' : 'desactivados'}`);
      this.clearSelection();
      this.processing = false;
    }
  }

  // ==================== REPORTES Y EXPORTACIÓN ====================

  /**
   * Exportar lista de usuarios
   */
  exportUsers(): void {
    this.processing = true;
    this.toastService.showInfo('Generando exportación de usuarios...');

    setTimeout(() => {
      const exportData = {
        fechaExportacion: new Date().toISOString(),
        totalUsuarios: this.filteredUsers.length,
        filtrosAplicados: {
          busqueda: this.searchTerm,
          rol: this.roleFilter,
          estado: this.statusFilter,
          ordenamiento: this.sortBy
        },
        usuarios: this.filteredUsers.map(user => ({
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.role,
          activo: user.isActive,
          fechaRegistro: user.fechaRegistro,
          favoritas: this.getUserFavorites(user.id),
          historial: this.getUserHistory(user.id)
        }))
      };

      // Simular descarga
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `usuarios-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.toastService.showSuccess('Exportación completada exitosamente');
      this.processing = false;
    }, 2000);
  }

  /**
   * Generar reporte de usuarios
   */
  generateUserReport(): void {
    this.processing = true;
    this.toastService.showInfo('Generando reporte de usuarios...');

    setTimeout(() => {
      const reporte = {
        titulo: 'Reporte de Usuarios del Sistema',
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        resumenEjecutivo: {
          totalUsuarios: this.getTotalUsers(),
          usuariosActivos: this.getActiveUsers(),
          administradores: this.getAdminUsers(),
          nuevosUsuarios30d: this.getRecentUsers(),
          porcentajeActivos: Math.round((this.getActiveUsers() / this.getTotalUsers()) * 100)
        },
        distribucionPorRol: {
          administradores: this.getAdminUsers(),
          clientes: this.getTotalUsers() - this.getAdminUsers()
        },
        estadisticasActividad: {
          usuariosConFavoritas: this.allUsers.filter(u => this.getUserFavorites(u.id) > 0).length,
          usuariosConHistorial: this.allUsers.filter(u => this.getUserHistory(u.id) > 0).length,
          promedioPeliculasFavoritas: this.getAverageFavorites(),
          promedioHistorial: this.getAverageHistory()
        },
        tendencias: {
          registrosPorMes: this.getRegistrationTrends(),
          actividad: this.getActivityTrends()
        },
        recomendaciones: [
          'Implementar programa de retención para usuarios inactivos',
          'Crear sistema de gamificación para aumentar engagement',
          'Desarrollar contenido personalizado basado en favoritas',
          'Establecer comunicación regular con usuarios premium'
        ]
      };

      console.log('=== REPORTE DE USUARIOS ===');
      console.log(reporte);
      console.log('==========================');

      this.toastService.showSuccess('Reporte de usuarios generado (ver consola)');
      this.processing = false;
    }, 3000);
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatear fecha
   */
  formatDate(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Calcular días transcurridos
   */
  getDaysAgo(fecha: string): number {
    const now = new Date();
    const then = new Date(fecha);
    const diffTime = Math.abs(now.getTime() - then.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Track function para ngFor
   */
  trackUser(index: number, user: Usuario): number {
    return user.id;
  }

  /**
   * Obtener promedio de favoritas
   */
  private getAverageFavorites(): number {
    const total = this.allUsers.reduce((sum, user) => sum + this.getUserFavorites(user.id), 0);
    return Math.round((total / this.allUsers.length) * 10) / 10;
  }

  /**
   * Obtener promedio de historial
   */
  private getAverageHistory(): number {
    const total = this.allUsers.reduce((sum, user) => sum + this.getUserHistory(user.id), 0);
    return Math.round((total / this.allUsers.length) * 10) / 10;
  }

  /**
   * Obtener tendencias de registro
   */
  private getRegistrationTrends(): any[] {
    const meses: { [key: string]: number } = {};
    
    this.allUsers.forEach(user => {
      const fecha = new Date(user.fechaRegistro);
      const mesAño = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      meses[mesAño] = (meses[mesAño] || 0) + 1;
    });
    
    return Object.entries(meses).map(([mes, cantidad]) => ({ mes, cantidad }));
  }

  /**
   * Obtener tendencias de actividad
   */
  private getActivityTrends(): any {
    return {
      usuariosConActividad: this.allUsers.filter(u => 
        this.getUserFavorites(u.id) > 0 || this.getUserHistory(u.id) > 0
      ).length,
      usuariosSinActividad: this.allUsers.filter(u => 
        this.getUserFavorites(u.id) === 0 && this.getUserHistory(u.id) === 0
      ).length
    };
  }
}