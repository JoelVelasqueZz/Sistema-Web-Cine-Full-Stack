import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';

// Importar jsPDF al inicio del archivo
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  // ✅ USAR API EN LUGAR DE DATOS LOCALES
  this.userService.getAllUsers().subscribe({
    next: (users) => {
      console.log('📡 Usuarios cargados desde BD:', users.length);
      this.allUsers = users;
      this.applyFilters();
      this.loading = false;
    },
    error: (error) => {
      console.error('❌ Error al cargar usuarios:', error);
      this.toastService.showError('Error al cargar la lista de usuarios');
      this.allUsers = [];
      this.filteredUsers = [];
      this.loading = false;
    }
  });
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
          return new Date(b.fechaRegistro ?? '').getTime() - new Date(a.fechaRegistro ?? '').getTime();
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
      new Date(user.fechaRegistro ?? '') >= thirtyDaysAgo
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
    
    // ✅ USAR API
    this.userService.changeUserRole(user.id, nuevoRol).subscribe({
      next: (success) => {
        if (success) {
          user.role = nuevoRol;
          this.toastService.showSuccess(`Rol de ${user.nombre} cambiado a ${nuevoRol}`);
        } else {
          this.toastService.showError('Error al cambiar el rol del usuario');
        }
        this.processing = false;
      },
      error: (error) => {
        console.error('❌ Error al cambiar rol:', error);
        this.toastService.showError('Error al cambiar el rol del usuario');
        this.processing = false;
      }
    });
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
    
    // ✅ USAR API
    this.userService.toggleUserStatus(user.id).subscribe({
      next: (success) => {
        if (success) {
          user.isActive = nuevoEstado;
          this.toastService.showSuccess(`Usuario ${user.nombre} ${nuevoEstado ? 'activado' : 'desactivado'}`);
        } else {
          this.toastService.showError(`Error al ${accion} el usuario`);
        }
        this.processing = false;
      },
      error: (error) => {
        console.error(`❌ Error al ${accion} usuario:`, error);
        this.toastService.showError(`Error al ${accion} el usuario`);
        this.processing = false;
      }
    });
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
  
  // ✅ USAR API
  this.userService.deleteUser(user.id).subscribe({
    next: (success) => {
      if (success) {
        // Remover de la lista local
        const index = this.allUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.allUsers.splice(index, 1);
          this.applyFilters();
        }
        this.toastService.showSuccess(`Usuario ${user.nombre} eliminado exitosamente`);
      } else {
        this.toastService.showError('Error al eliminar el usuario');
      }
      this.processing = false;
    },
    error: (error) => {
      console.error('❌ Error al eliminar usuario:', error);
      this.toastService.showError('Error al eliminar el usuario');
      this.processing = false;
    }
  });
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
    let completedCount = 0;

    this.selectedUsers.forEach(userId => {
      this.userService.changeUserRole(userId, newRole).subscribe({
        next: (success) => {
          completedCount++;
          if (success) {
            const user = this.allUsers.find(u => u.id === userId);
            if (user) {
              user.role = newRole;
              successCount++;
            }
          }

          // Cuando todas las peticiones terminen
          if (completedCount === this.selectedUsers.length) {
            this.toastService.showSuccess(`${successCount} usuario(s) cambiados a ${newRole}`);
            this.clearSelection();
            this.processing = false;
          }
        },
        error: (error) => {
          completedCount++;
          console.error('❌ Error en cambio masivo:', error);
          
          if (completedCount === this.selectedUsers.length) {
            this.toastService.showSuccess(`${successCount} usuario(s) cambiados a ${newRole}`);
            this.clearSelection();
            this.processing = false;
          }
        }
      });
    });
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
    let completedCount = 0;

    this.selectedUsers.forEach(userId => {
      const user = this.allUsers.find(u => u.id === userId);
      
      // Solo procesar si el estado actual es diferente al deseado
      if (user && user.isActive !== activate) {
        this.userService.toggleUserStatus(userId).subscribe({
          next: (success) => {
            completedCount++;
            if (success) {
              user.isActive = activate;
              successCount++;
            }

            if (completedCount === this.selectedUsers.length) {
              this.toastService.showSuccess(`${successCount} usuario(s) ${activate ? 'activados' : 'desactivados'}`);
              this.clearSelection();
              this.processing = false;
            }
          },
          error: (error) => {
            completedCount++;
            console.error('❌ Error en acción masiva:', error);
            
            if (completedCount === this.selectedUsers.length) {
              this.toastService.showSuccess(`${successCount} usuario(s) ${activate ? 'activados' : 'desactivados'}`);
              this.clearSelection();
              this.processing = false;
            }
          }
        });
      } else {
        // Si no necesita cambio, contar como completado
        completedCount++;
        if (completedCount === this.selectedUsers.length) {
          this.toastService.showSuccess(`${successCount} usuario(s) ${activate ? 'activados' : 'desactivados'}`);
          this.clearSelection();
          this.processing = false;
        }
      }
    });
  }
}

  // ==================== REPORTES Y EXPORTACIÓN ====================

  /**
   * Exportar lista de usuarios en PDF
   */
  exportUsers(): void {
    this.processing = true;
    this.toastService.showInfo('Generando exportación de usuarios en PDF...');

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // Configurar encabezado
        this.setupPDFHeader(doc, 'EXPORTACIÓN DE USUARIOS', 
          `Lista filtrada de usuarios del sistema - ${this.filteredUsers.length} usuarios`);
        
        let currentY = 110;
        
        // Información de filtros aplicados
        if (this.hasActiveFilters()) {
          doc.setFillColor(240, 240, 240);
          doc.rect(20, currentY - 5, 170, 15, 'F');
          doc.setFontSize(12);
          doc.setTextColor(52, 73, 94);
          doc.text('FILTROS APLICADOS', 25, currentY + 5);
          currentY += 20;
          
          const filtros = [];
          if (this.searchTerm) filtros.push(`Búsqueda: "${this.searchTerm}"`);
          if (this.roleFilter) filtros.push(`Rol: ${this.roleFilter}`);
          if (this.statusFilter !== '') filtros.push(`Estado: ${this.statusFilter === 'true' ? 'Activos' : 'Inactivos'}`);
          
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          filtros.forEach(filtro => {
            doc.text(`• ${filtro}`, 25, currentY);
            currentY += 8;
          });
          currentY += 10;
        }
        
        // Tabla de usuarios
        const usuariosData = this.filteredUsers.map((usuario, index) => [
          (index + 1).toString(),
          usuario.nombre,
          usuario.email.length > 30 ? usuario.email.substring(0, 30) + '...' : usuario.email,
          usuario.role === 'admin' ? 'Admin' : 'Cliente',
          usuario.isActive ? 'Activo' : 'Inactivo',
          this.formatDate(usuario.fechaRegistro ?? ''),
          this.getUserFavorites(usuario.id).toString(),
          this.getUserHistory(usuario.id).toString()
        ]);
        
        autoTable(doc, {
          head: [['#', 'Nombre', 'Email', 'Rol', 'Estado', 'Registro', 'Favoritas', 'Vistas']],
          body: usuariosData,
          startY: currentY,
          theme: 'striped',
          headStyles: { 
            fillColor: [52, 152, 219],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 8,
            cellPadding: { top: 3, right: 4, bottom: 3, left: 4 }
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 30 },
            2: { cellWidth: 45 },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 25, halign: 'center' },
            6: { cellWidth: 18, halign: 'center' },
            7: { cellWidth: 18, halign: 'center' }
          },
          alternateRowStyles: { fillColor: [248, 249, 250] }
        });
        
        // Configurar pie de página
        this.setupPDFFooter(doc);
        
        // Descargar PDF
        doc.save(`usuarios-export-${new Date().toISOString().split('T')[0]}.pdf`);
        
        this.processing = false;
        this.toastService.showSuccess('Exportación de usuarios completada en PDF');
        
      } catch (error) {
        console.error('Error generando exportación:', error);
        this.processing = false;
        this.toastService.showError('Error al generar la exportación PDF');
      }
    }, 1000);
  }

  /**
   * Generar reporte completo de usuarios en PDF
   */
  generateUserReport(): void {
    this.processing = true;
    this.toastService.showInfo('Generando reporte completo de usuarios...');

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // === PÁGINA 1: RESUMEN EJECUTIVO ===
        this.setupPDFHeader(doc, 'REPORTE COMPLETO DE USUARIOS', 
          'Análisis detallado de la base de usuarios del sistema');
        
        let currentY = 110;
        
        // Resumen ejecutivo
        doc.setFillColor(240, 240, 240);
        doc.rect(20, currentY - 5, 170, 15, 'F');
        doc.setFontSize(14);
        doc.setTextColor(52, 73, 94);
        doc.text('RESUMEN EJECUTIVO', 25, currentY + 5);
        currentY += 20;
        
        const resumenData = [
          ['Total de Usuarios', this.getTotalUsers().toString()],
          ['Usuarios Activos', `${this.getActiveUsers()} (${Math.round((this.getActiveUsers()/this.getTotalUsers())*100)}%)`],
          ['Usuarios Inactivos', `${this.getTotalUsers() - this.getActiveUsers()} (${Math.round(((this.getTotalUsers() - this.getActiveUsers())/this.getTotalUsers())*100)}%)`],
          ['Administradores', `${this.getAdminUsers()} (${Math.round((this.getAdminUsers()/this.getTotalUsers())*100)}%)`],
          ['Clientes', `${this.getTotalUsers() - this.getAdminUsers()} (${Math.round(((this.getTotalUsers() - this.getAdminUsers())/this.getTotalUsers())*100)}%)`],
          ['Nuevos Usuarios (30d)', this.getRecentUsers().toString()],
          ['Promedio Favoritas', this.getAverageFavorites().toString()],
          ['Promedio Historial', this.getAverageHistory().toString()]
        ];
        
        autoTable(doc, {
          body: resumenData,
          startY: currentY,
          theme: 'plain',
          styles: { 
            fontSize: 11,
            cellPadding: { top: 5, right: 10, bottom: 5, left: 10 }
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 100, fillColor: [248, 249, 250] },
            1: { cellWidth: 70, halign: 'center', fillColor: [255, 255, 255] }
          }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 20;
        
        // Análisis de actividad
        doc.setFillColor(240, 240, 240);
        doc.rect(20, currentY - 5, 170, 15, 'F');
        doc.setFontSize(14);
        doc.setTextColor(52, 73, 94);
        doc.text('ANÁLISIS DE ACTIVIDAD', 25, currentY + 5);
        currentY += 20;
        
        const usuariosConFavoritas = this.allUsers.filter(u => this.getUserFavorites(u.id) > 0).length;
        const usuariosConHistorial = this.allUsers.filter(u => this.getUserHistory(u.id) > 0).length;
        
        const actividadData = [
          ['Usuarios con Favoritas', `${usuariosConFavoritas} (${Math.round((usuariosConFavoritas/this.getTotalUsers())*100)}%)`],
          ['Usuarios con Historial', `${usuariosConHistorial} (${Math.round((usuariosConHistorial/this.getTotalUsers())*100)}%)`],
          ['Usuarios Sin Actividad', `${this.getTotalUsers() - Math.max(usuariosConFavoritas, usuariosConHistorial)} usuarios`],
          ['Tasa de Engagement', `${Math.round((Math.max(usuariosConFavoritas, usuariosConHistorial)/this.getTotalUsers())*100)}%`]
        ];
        
        autoTable(doc, {
          body: actividadData,
          startY: currentY,
          theme: 'plain',
          styles: { 
            fontSize: 11,
            cellPadding: { top: 5, right: 10, bottom: 5, left: 10 }
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 100, fillColor: [248, 249, 250] },
            1: { cellWidth: 70, halign: 'center', fillColor: [255, 255, 255] }
          }
        });
        
        // === PÁGINA 2: LISTA DETALLADA ===
        doc.addPage();
        this.setupPDFHeader(doc, 'DIRECTORIO COMPLETO', 'Lista detallada de todos los usuarios');
        
        currentY = 110;
        
        // Top usuarios más activos
        doc.setFillColor(240, 240, 240);
        doc.rect(20, currentY - 5, 170, 15, 'F');
        doc.setFontSize(14);
        doc.setTextColor(52, 73, 94);
        doc.text('TOP USUARIOS MÁS ACTIVOS', 25, currentY + 5);
        currentY += 15;
        
        const usuariosOrdenados = this.allUsers
          .map(u => ({
            ...u,
            actividad: this.getUserFavorites(u.id) + this.getUserHistory(u.id)
          }))
          .sort((a, b) => b.actividad - a.actividad)
          .slice(0, 10);
          
        const topUsuariosData = usuariosOrdenados.map((usuario, index) => [
          (index + 1).toString(),
          usuario.nombre,
          usuario.role === 'admin' ? 'Admin' : 'Cliente',
          usuario.isActive ? 'Activo' : 'Inactivo',
          this.getUserFavorites(usuario.id).toString(),
          this.getUserHistory(usuario.id).toString(),
          usuario.actividad.toString()
        ]);
        
        autoTable(doc, {
          head: [['#', 'Nombre', 'Rol', 'Estado', 'Favoritas', 'Vistas', 'Total']],
          body: topUsuariosData,
          startY: currentY,
          theme: 'striped',
          headStyles: { 
            fillColor: [46, 204, 113],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 9,
            cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 22, halign: 'center' },
            5: { cellWidth: 22, halign: 'center' },
            6: { cellWidth: 22, halign: 'center' }
          },
          alternateRowStyles: { fillColor: [248, 249, 250] }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 20;
        
        // Recomendaciones
        doc.setFillColor(240, 240, 240);
        doc.rect(20, currentY - 5, 170, 15, 'F');
        doc.setFontSize(14);
        doc.setTextColor(52, 73, 94);
        doc.text('RECOMENDACIONES', 25, currentY + 5);
        currentY += 20;
        
        const recomendaciones = [
          'Implementar programa de retención para usuarios inactivos',
          'Crear sistema de gamificación para aumentar engagement',
          'Desarrollar contenido personalizado basado en favoritas',
          'Establecer comunicación regular con usuarios frecuentes',
          'Analizar patrones de uso para mejorar la experiencia'
        ];
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        recomendaciones.forEach(recomendacion => {
          doc.text(`• ${recomendacion}`, 25, currentY);
          currentY += 10;
        });
        
        // Configurar pie de página
        this.setupPDFFooter(doc);
        
        // Descargar PDF
        doc.save(`reporte-usuarios-completo-${new Date().toISOString().split('T')[0]}.pdf`);
        
        this.processing = false;
        this.toastService.showSuccess('Reporte completo de usuarios generado en PDF');
        
      } catch (error) {
        console.error('Error generando reporte:', error);
        this.processing = false;
        this.toastService.showError('Error al generar el reporte PDF');
      }
    }, 2000);
  }

  // ==================== MÉTODOS AUXILIARES PARA PDF ====================

  /**
   * Configurar encabezado del PDF
   */
  private setupPDFHeader(doc: jsPDF, titulo: string, subtitulo?: string): void {
    // Fondo del encabezado
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Logo y título principal en blanco
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('CinemaApp', 20, 25);
    
    doc.setFontSize(12);
    doc.text('Gestión de Usuarios', 20, 35);
    
    // Título del reporte
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(titulo, 20, 60);
    
    if (subtitulo) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitulo, 20, 72);
    }
    
    // Información de generación
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const fechaGeneracion = new Date().toLocaleString('es-ES');
    doc.text(`Generado el: ${fechaGeneracion}`, 20, 85);
    doc.text(`Por: ${this.authService.getCurrentUser()?.nombre || 'Admin'}`, 20, 95);
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth
    doc.setLineWidth(0.5);
   doc.line(20, 100, 190, 100);
 }

 /**
  * Configurar pie de página del PDF
  */
 private setupPDFFooter(doc: jsPDF): void {
   const pageCount = (doc as any).internal.getNumberOfPages();
   
   for (let i = 1; i <= pageCount; i++) {
     doc.setPage(i);
     
     // Línea superior del pie
     doc.setDrawColor(41, 128, 185);
     doc.setLineWidth(1);
     doc.line(20, 275, 190, 275);
     
     // Información del pie
     doc.setFontSize(8);
     doc.setTextColor(100, 100, 100);
     doc.text('CinemaApp - Gestión de Usuarios', 20, 282);
     doc.text('Documento Confidencial - Solo uso interno', 20, 287);
     
     // Página actual
     doc.setTextColor(41, 128, 185);
     doc.text(`Página ${i} de ${pageCount}`, 150, 282);
     
     // Timestamp
     const timestamp = new Date().toLocaleTimeString('es-ES', { 
       hour: '2-digit', 
       minute: '2-digit' 
     });
     doc.text(`Hora: ${timestamp}`, 150, 287);
   }
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
   if (this.allUsers.length === 0) return 0;
   const total = this.allUsers.reduce((sum, user) => sum + this.getUserFavorites(user.id), 0);
   return Math.round((total / this.allUsers.length) * 10) / 10;
 }

 /**
  * Obtener promedio de historial
  */
 private getAverageHistory(): number {
   if (this.allUsers.length === 0) return 0;
   const total = this.allUsers.reduce((sum, user) => sum + this.getUserHistory(user.id), 0);
   return Math.round((total / this.allUsers.length) * 10) / 10;
 }

 /**
  * Obtener tendencias de registro
  */
 private getRegistrationTrends(): any[] {
   const meses: { [key: string]: number } = {};
   
   this.allUsers.forEach(user => {
     const fecha = new Date(user.fechaRegistro ?? '');
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