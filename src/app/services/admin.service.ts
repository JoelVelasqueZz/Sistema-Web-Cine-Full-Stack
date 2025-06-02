import { Injectable } from '@angular/core';
import { MovieService, Pelicula, FuncionCine } from './movie.service';
import { UserService, PeliculaFavorita, HistorialItem } from './user.service';
import { AuthService, Usuario } from './auth.service';

export interface AdminStats {
  totalPeliculas: number;
  totalUsuarios: number;
  totalVentas: number;
  ingresosMes: number;
  usuariosActivos: number;
  peliculasPopulares: PeliculaPopular[];
  ventasRecientes: VentaReciente[];
  generosMasPopulares: GeneroStats[];
  actividadReciente: ActividadReciente[];
}

export interface PeliculaPopular {
  titulo: string;
  vistas: number;
  rating: number;
  genero: string;
}

export interface VentaReciente {
  id: string;
  usuario: string;
  pelicula: string;
  fecha: string;
  total: number;
  estado: 'completada' | 'pendiente' | 'cancelada';
  entradas: number;
}

export interface GeneroStats {
  genero: string;
  cantidad: number;
  porcentaje: number;
}

export interface ActividadReciente {
  tipo: 'registro' | 'compra' | 'pelicula_agregada';
  descripcion: string;
  fecha: string;
  icono: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  
  // Datos simulados para el dashboard
  private ventasSimuladas: VentaReciente[] = [
    {
      id: 'V001',
      usuario: 'Juan Pérez',
      pelicula: 'Avatar: El Camino del Agua',
      fecha: '2025-05-28',
      total: 25.50,
      estado: 'completada',
      entradas: 2
    },
    {
      id: 'V002',
      usuario: 'María García',
      pelicula: 'Top Gun: Maverick',
      fecha: '2025-05-29',
      total: 38.25,
      estado: 'completada',
      entradas: 3
    },
    {
      id: 'V003',
      usuario: 'Carlos López',
      pelicula: 'Black Panther: Wakanda Forever',
      fecha: '2025-05-30',
      total: 17.00,
      estado: 'pendiente',
      entradas: 1
    },
    {
      id: 'V004',
      usuario: 'Ana Martínez',
      pelicula: 'Dune',
      fecha: '2025-05-31',
      total: 45.75,
      estado: 'completada',
      entradas: 3
    },
    {
      id: 'V005',
      usuario: 'Pedro Rodríguez',
      pelicula: 'Spider-Man: No Way Home',
      fecha: '2025-06-01',
      total: 21.25,
      estado: 'completada',
      entradas: 1
    }
  ];

  private actividadSimulada: ActividadReciente[] = [
    {
      tipo: 'registro',
      descripcion: 'Nuevo usuario registrado: Ana Martínez',
      fecha: '2025-06-01 14:30',
      icono: 'fas fa-user-plus',
      color: 'success'
    },
    {
      tipo: 'compra',
      descripcion: 'Pedro compró 1 entrada para Spider-Man',
      fecha: '2025-06-01 13:15',
      icono: 'fas fa-shopping-cart',
      color: 'primary'
    },
    {
      tipo: 'pelicula_agregada',
      descripcion: 'Nueva película agregada: Guardians of Galaxy Vol. 3',
      fecha: '2025-06-01 10:45',
      icono: 'fas fa-film',
      color: 'info'
    }
  ];

  constructor(
    private movieService: MovieService,
    private userService: UserService,
    private authService: AuthService
  ) { }

  // ==================== DASHBOARD STATS ====================
  
  getAdminStats(): AdminStats {
    const peliculas = this.movieService.getPeliculas();
    const usuarios = this.getAllUsersFromAuth();
    
    return {
      totalPeliculas: peliculas.length,
      totalUsuarios: usuarios.length,
      totalVentas: this.ventasSimuladas.length,
      ingresosMes: this.calculateIngresosMes(),
      usuariosActivos: usuarios.filter(u => u.isActive !== false).length,
      peliculasPopulares: this.getPeliculasPopulares(),
      ventasRecientes: this.ventasSimuladas.slice(-5),
      generosMasPopulares: this.getGeneroStats(),
      actividadReciente: this.actividadSimulada.slice(-10)
    };
  }

  private calculateIngresosMes(): number {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();
    
    return this.ventasSimuladas
      .filter(v => {
        const fechaVenta = new Date(v.fecha);
        return v.estado === 'completada' && 
               fechaVenta.getMonth() === mesActual && 
               fechaVenta.getFullYear() === anioActual;
      })
      .reduce((sum, v) => sum + v.total, 0);
  }

  private getPeliculasPopulares(): PeliculaPopular[] {
    const peliculas = this.movieService.getPeliculas();
    return peliculas
      .slice(0, 5)
      .map(p => ({
        titulo: p.titulo,
        vistas: Math.floor(Math.random() * 1000) + 100,
        rating: p.rating,
        genero: p.genero
      }));
  }

  private getGeneroStats(): GeneroStats[] {
    const peliculas = this.movieService.getPeliculas();
    const generos: { [key: string]: number } = {};
    
    peliculas.forEach(p => {
      generos[p.genero] = (generos[p.genero] || 0) + 1;
    });
    
    const total = peliculas.length;
    return Object.entries(generos).map(([genero, cantidad]) => ({
      genero,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100)
    }));
  }

  // ==================== GESTIÓN DE PELÍCULAS (CORREGIDO) ====================
  
  /**
   * Crear nueva película usando MovieService
   */
  createPelicula(peliculaData: Omit<Pelicula, 'idx'>): boolean {
    try {
      // Validar datos antes de crear
      const validacion = this.movieService.validatePeliculaData(peliculaData);
      if (!validacion.valid) {
        console.error('Datos de película inválidos:', validacion.errors);
        return false;
      }

      // Usar el método real del MovieService
      const resultado = this.movieService.addPelicula(peliculaData);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Nueva película agregada: ${peliculaData.titulo}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-film',
          color: 'info'
        });
        
        console.log('✅ Película creada exitosamente:', peliculaData.titulo);
      } else {
        console.error('❌ Error al crear película en MovieService');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al crear película:', error);
      return false;
    }
  }

  /**
   * Actualizar película existente usando MovieService
   */
  updatePelicula(peliculaIndex: number, peliculaData: Partial<Pelicula>): boolean {
    try {
      // Validar datos si hay cambios significativos
      if (peliculaData.titulo || peliculaData.sinopsis || peliculaData.genero) {
        const validacion = this.movieService.validatePeliculaData(peliculaData);
        if (!validacion.valid) {
          console.error('Datos de película inválidos:', validacion.errors);
          return false;
        }
      }

      // Usar el método real del MovieService
      const resultado = this.movieService.updatePelicula(peliculaIndex, peliculaData);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Película actualizada: ${peliculaData.titulo || 'Sin título'}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-edit',
          color: 'warning'
        });
        
        console.log('✅ Película actualizada exitosamente');
      } else {
        console.error('❌ Error al actualizar película en MovieService');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al actualizar película:', error);
      return false;
    }
  }

  /**
   * Eliminar película usando MovieService
   */
  deletePelicula(peliculaIndex: number): boolean {
    try {
      // Obtener información de la película antes de eliminarla
      const pelicula = this.movieService.getPelicula(peliculaIndex);
      
      if (!pelicula) {
        console.error('❌ Película no encontrada en el índice:', peliculaIndex);
        return false;
      }
      
      // Usar el método real del MovieService
      const resultado = this.movieService.deletePelicula(peliculaIndex);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Película eliminada: ${pelicula.titulo}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-trash',
          color: 'danger'
        });
        
        console.log('✅ Película eliminada exitosamente:', pelicula.titulo);
      } else {
        console.error('❌ Error al eliminar película en MovieService');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al eliminar película:', error);
      return false;
    }
  }

  /**
   * Validar datos de película (delegando al MovieService)
   */
  validatePeliculaData(pelicula: Partial<Pelicula>): { valid: boolean; errors: string[] } {
    return this.movieService.validatePeliculaData(pelicula);
  }

  /**
   * Obtener todas las películas
   */
  getAllPeliculas(): Pelicula[] {
    return this.movieService.getPeliculas();
  }

  /**
   * Buscar películas
   */
  buscarPeliculas(termino: string): Pelicula[] {
    return this.movieService.buscarPeliculas(termino);
  }

  // ==================== GESTIÓN DE FUNCIONES ====================

  /**
   * Agregar función a una película
   */
  addFuncionToPelicula(peliculaIndex: number, funcion: Omit<FuncionCine, 'id'>): boolean {
    try {
      const resultado = this.movieService.addFuncionToPelicula(peliculaIndex, funcion);
      
      if (resultado) {
        const pelicula = this.movieService.getPelicula(peliculaIndex);
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Nueva función agregada para: ${pelicula?.titulo || 'Película'}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-calendar-plus',
          color: 'success'
        });
        
        console.log('✅ Función agregada exitosamente');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al agregar función:', error);
      return false;
    }
  }

  /**
   * Eliminar función específica
   */
  deleteFuncion(funcionId: string): boolean {
    try {
      const resultado = this.movieService.deleteFuncion(funcionId);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Función eliminada: ${funcionId}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-calendar-times',
          color: 'warning'
        });
        
        console.log('✅ Función eliminada exitosamente');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al eliminar función:', error);
      return false;
    }
  }

  /**
   * Obtener funciones de una película
   */
  getFuncionesPelicula(peliculaIndex: number): FuncionCine[] {
    return this.movieService.getFuncionesPelicula(peliculaIndex);
  }

  // ==================== GESTIÓN DE USUARIOS ====================
  
  // Obtener todos los usuarios desde AuthService
  private getAllUsersFromAuth(): Usuario[] {
    // Como tu AuthService tiene usuarios privados, necesitarías un método público
    // Por ahora simulo con datos básicos
    return [
      {
        id: 1,
        nombre: 'Juan Pérez',
        email: 'juan@email.com',
        password: '123456',
        fechaRegistro: '2024-01-15',
        avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=4CAF50&color=fff&size=128',
        role: 'cliente',
        isActive: true
      },
      {
        id: 2,
        nombre: 'María García',
        email: 'maria@email.com',
        password: 'admin',
        fechaRegistro: '2024-02-10',
        avatar: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=2196F3&color=fff&size=128',
        role: 'admin',
        isActive: true
      },
      {
        id: 3,
        nombre: 'Admin Sistema',
        email: 'admin@parkyfilms.com',
        password: 'admin123',
        fechaRegistro: '2024-01-01',
        avatar: 'https://ui-avatars.com/api/?name=Admin+Sistema&background=FF5722&color=fff&size=128',
        role: 'admin',
        isActive: true
      }
    ];
  }

  // Obtener todos los usuarios (solo para admin)
  getAllUsers(): Usuario[] {
    return this.getAllUsersFromAuth();
  }

  // Cambiar rol de usuario (simulado)
  changeUserRole(userId: number, nuevoRol: 'cliente' | 'admin'): boolean {
    try {
      // Nota: Tu AuthService no tiene método updateUser
      console.log(`Cambiando rol del usuario ${userId} a ${nuevoRol}`);
      
      this.addActividad({
        tipo: 'registro',
        descripcion: `Usuario ID:${userId} ahora es ${nuevoRol}`,
        fecha: new Date().toISOString(),
        icono: 'fas fa-user-cog',
        color: 'warning'
      });
      
      return true;
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      return false;
    }
  }

  // Activar/Desactivar usuario (simulado)
  toggleUserStatus(userId: number): boolean {
    try {
      // Nota: Tu AuthService no tiene método updateUser
      console.log(`Cambiando estado del usuario ${userId}`);
      
      this.addActividad({
        tipo: 'registro',
        descripcion: `Estado del usuario ID:${userId} cambiado`,
        fecha: new Date().toISOString(),
        icono: 'fas fa-user-check',
        color: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      return false;
    }
  }

  // ==================== REPORTES Y ANALYTICS ====================
  
  getVentasReport(fechaInicio: string, fechaFin: string): any {
    const ventasFiltradas = this.ventasSimuladas.filter(v => 
      v.fecha >= fechaInicio && v.fecha <= fechaFin
    );
    return {
      totalVentas: ventasFiltradas.length,
      ingresoTotal: ventasFiltradas
        .filter(v => v.estado === 'completada')
        .reduce((sum, v) => sum + v.total, 0),
      entradasVendidas: ventasFiltradas
        .reduce((sum, v) => sum + v.entradas, 0),
      ventasPorDia: this.groupVentasByDate(ventasFiltradas)
    };
  }

  private groupVentasByDate(ventas: VentaReciente[]): any[] {
    const grouped = ventas.reduce((acc, venta) => {
      const fecha = venta.fecha;
      if (!acc[fecha]) {
        acc[fecha] = { fecha, ventas: 0, ingresos: 0 };
      }
      acc[fecha].ventas++;
      if (venta.estado === 'completada') {
        acc[fecha].ingresos += venta.total;
      }
      return acc;
    }, {} as any);
    return Object.values(grouped);
  }

  // ==================== UTILIDADES ====================
  
  private addActividad(actividad: ActividadReciente): void {
    this.actividadSimulada.unshift(actividad);
    // Mantener solo las últimas 20 actividades
    if (this.actividadSimulada.length > 20) {
      this.actividadSimulada = this.actividadSimulada.slice(0, 20);
    }
  }

  // Verificar permisos de admin
  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }

  // Simular nueva venta (para testing)
  addVentaSimulada(venta: Omit<VentaReciente, 'id'>): void {
    const nuevaVenta: VentaReciente = {
      ...venta,
      id: 'V' + (this.ventasSimuladas.length + 1).toString().padStart(3, '0')
    };
    
    this.ventasSimuladas.push(nuevaVenta);
    
    this.addActividad({
      tipo: 'compra',
      descripcion: `${venta.usuario} compró ${venta.entradas} entrada(s) para ${venta.pelicula}`,
      fecha: new Date().toISOString(),
      icono: 'fas fa-shopping-cart',
      color: 'primary'
    });
  }

  // ==================== MÉTODOS PARA EXTENDER TUS SERVICIOS ====================
  
  // Estos métodos los puedes agregar a tu MovieService cuando tengas backend
  addPeliculaToService(pelicula: Pelicula): boolean {
    // Este método debería estar en MovieService
    console.log('Agregando película al servicio:', pelicula);
    return true;
  }

  updatePeliculaInService(index: number, pelicula: Partial<Pelicula>): boolean {
    // Este método debería estar en MovieService
    console.log('Actualizando película en servicio:', index, pelicula);
    return true;
  }

  deletePeliculaFromService(index: number): boolean {
    // Este método debería estar en MovieService
    console.log('Eliminando película del servicio:', index);
    return true;
  }
}