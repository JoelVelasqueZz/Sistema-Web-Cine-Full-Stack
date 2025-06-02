import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth.service';
import { UserService, HistorialItem } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-history',
  standalone: false,
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  
  currentUser: Usuario | null = null;
  historial: HistorialItem[] = [];
  loading: boolean = true;
  filtroTipo: string = 'todas';
  filtroFecha: string = 'todas';
  
  // Para paginación
  itemsPorPagina: number = 10;
  paginaActual: number = 1;

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadHistorial();
  }

  loadHistorial(): void {
    if (!this.currentUser) {
      this.loading = false;
      return;
    }

    this.loading = true;
    
    // Simular carga
    setTimeout(() => {
      this.historial = this.userService.getUserHistory(this.currentUser!.id);
      this.loading = false;
    }, 500);
  }

  get historialFiltrado(): HistorialItem[] {
    let filtrado = this.historial;
    
    // Filtrar por tipo de acción
    if (this.filtroTipo !== 'todas') {
      filtrado = filtrado.filter(item => item.tipoAccion === this.filtroTipo);
    }
    
    // Filtrar por fecha
    if (this.filtroFecha !== 'todas') {
      const hoy = new Date();
      filtrado = filtrado.filter(item => {
        const fechaItem = new Date(item.fechaVista);
        switch (this.filtroFecha) {
          case 'hoy':
            return this.isSameDay(fechaItem, hoy);
          case 'semana':
            const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
            return fechaItem >= hace7Dias;
          case 'mes':
            const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
            return fechaItem >= hace30Dias;
          default:
            return true;
        }
      });
    }
    
    return filtrado;
  }

  get historialPaginado(): HistorialItem[] {
    const filtrado = this.historialFiltrado;
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return filtrado.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.historialFiltrado.length / this.itemsPorPagina);
  }

  verPelicula(peliculaId: number): void {
    this.router.navigate(['/movie', peliculaId]);
  }

  clearHistory(): void {
    if (!this.currentUser) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar todo tu historial?')) {
      const success = this.userService.clearHistory(this.currentUser.id);
      if (success) {
        this.historial = [];
        this.toastService.showSuccess('Historial eliminado correctamente');
      } else {
        this.toastService.showError('Error al eliminar el historial');
      }
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

    filtrarPorTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.paginaActual = 1;
  }

  filtrarPorFecha(fecha: string): void {
    this.filtroFecha = fecha;
    this.paginaActual = 1;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  getTimeAgo(fechaVista: string): string {
    const fecha = new Date(fechaVista);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Hace un momento' : `Hace ${diffMinutes} minutos`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'Ayer' : `Hace ${diffDays} días`;
    } else {
      return fecha.toLocaleDateString('es-ES');
    }
  }

    getTipoIcon(tipo: string): string {
    switch (tipo) {
      case 'vista': return 'fas fa-eye';
      case 'comprada': return 'fas fa-shopping-cart';
      default: return 'fas fa-film';
    }
  }

  getTipoColor(tipo: string): string {
    switch (tipo) {
      case 'vista': return 'text-info';
      case 'comprada': return 'text-success';
      default: return 'text-primary';
    }
  }

   getTipoText(tipo: string): string {
    switch (tipo) {
      case 'vista': return 'Vista';
      case 'comprada': return 'Comprada';
      default: return tipo;
    }
  }
}