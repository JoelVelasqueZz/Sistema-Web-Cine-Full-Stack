import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MovieService {

  // 🔗 API Configuration
  private readonly API_URL = 'http://localhost:3000/api';

  // 🎬 Datos locales para funciones, asientos y próximos estrenos (se migrarán después)
  private funcionesCine: { [peliculaId: number]: FuncionCine[] } = {
    1: [ // Primer película de la BD
      {
        id: 'av2-001',
        fecha: '2024-12-20',
        hora: '14:30',
        sala: 'Sala 1 - IMAX',
        precio: 12.50,
        asientosDisponibles: 45,
        formato: 'IMAX 3D'
      },
      {
        id: 'av2-002',
        fecha: '2024-12-20',
        hora: '17:45',
        sala: 'Sala 2',
        precio: 8.50,
        asientosDisponibles: 32,
        formato: '2D'
      }
    ],
    2: [
      {
        id: 'tg-001',
        fecha: '2024-12-20',
        hora: '16:00',
        sala: 'Sala 3',
        precio: 9.00,
        asientosDisponibles: 38,
        formato: '2D'
      }
    ],
    3: [
      {
        id: 'bp-001',
        fecha: '2024-12-20',
        hora: '15:15',
        sala: 'Sala 4',
        precio: 8.50,
        asientosDisponibles: 42,
        formato: '2D'
      }
    ]
  };

  private proximosEstrenos: ProximoEstreno[] = [
    {
      id: 1,
      titulo: "Kayara: La Princesa Inca",
      sinopsis: "Una épica aventura que narra la historia de Kayara, una valiente princesa inca que debe salvar su reino de una amenaza ancestral.",
      poster: "assets/movies/kayara.png",
      fechaEstreno: "2025-06-06",
      estudio: "assets/studios/paramount.png",
      genero: "Aventura",
      director: "Carlos López Estrada",
      trailer: "rDX5wVVBW4Y",
      duracion: "2h 10min",
      actores: ["Yalitza Aparicio", "Oscar Isaac", "Stephanie Beatriz", "John Leguizamo"]
    },
    {
      id: 2,
      titulo: "Elio",
      sinopsis: "Elio, un niño soñador y fanático del espacio, es confundido accidentalmente con el representante intergaláctico de la Tierra.",
      poster: "assets/movies/elio.png",
      fechaEstreno: "2025-06-13",
      estudio: "assets/studios/disney.png",
      genero: "Animación",
      director: "Adrian Molina",
      trailer: "QkA4XR5GUos",
      duracion: "1h 35min",
      actores: ["Yonas Kibreab", "Zoe Saldaña", "Remy Edgerly", "Brad Garrett"]
    }
  ];

  private seatMaps: { [salaId: string]: SeatMap } = {
    'Sala 1 - IMAX': {
      rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      seatsPerRow: 12,
      vipRows: ['E', 'F'],
      disabledSeats: ['A1', 'A12', 'H1', 'H12'],
      occupiedSeats: []
    },
    'Sala 2': {
      rows: ['A', 'B', 'C', 'D', 'E', 'F'],
      seatsPerRow: 10,
      vipRows: ['D', 'E'],
      disabledSeats: [],
      occupiedSeats: ['C5', 'C6', 'D7']
    },
    'default': {
      rows: ['A', 'B', 'C', 'D', 'E', 'F'],
      seatsPerRow: 10,
      vipRows: ['D', 'E'],
      disabledSeats: [],
      occupiedSeats: []
    }
  };

  constructor(private http: HttpClient) {
    console.log('🎬 MovieService conectado a API:', this.API_URL);
  }

  // ==================== MÉTODOS DE API (PELÍCULAS) ====================

  /**
   * Obtener todas las películas desde la API PostgreSQL
   */
  getPeliculas(): Observable<Pelicula[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/movies`).pipe(
      map(response => {
        console.log('📡 Películas obtenidas de PostgreSQL:', response.data?.length || 0);
        return (response.data || []).map(pelicula => this.convertApiToLocal(pelicula));
      }),
      catchError(error => {
        console.error('❌ Error al obtener películas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener película por ID
   */
  getPeliculaById(id: number): Observable<Pelicula | null> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/movies/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('📡 Película obtenida:', response.data.titulo);
          return this.convertApiToLocal(response.data);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Error al obtener película:', error);
        return of(null);
      })
    );
  }

  /**
   * Buscar películas por término
   */
  buscarPeliculas(termino: string): Observable<Pelicula[]> {
    const encodedTerm = encodeURIComponent(termino);
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/movies/search?q=${encodedTerm}`).pipe(
      map(response => {
        console.log(`🔍 Resultados para "${termino}":`, response.data?.length || 0);
        return (response.data || []).map(pelicula => this.convertApiToLocal(pelicula));
      }),
      catchError(error => {
        console.error('❌ Error en búsqueda:', error);
        // Si falla, buscar en datos locales como fallback
        return of([]);
      })
    );
  }

  /**
   * Agregar nueva película (solo admin)
   */
  addPelicula(peliculaData: Omit<Pelicula, 'id' | 'idx'>): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    // Convertir formato local a formato API
    const apiData = this.convertLocalToApi(peliculaData);
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/movies`, apiData, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Película creada:', response.data?.titulo || 'Sin título');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al crear película:', error);
        return of(false);
      })
    );
  }

  /**
   * Actualizar película existente (solo admin)
   */
  updatePelicula(id: number, peliculaData: Partial<Pelicula>): Observable<boolean> {
    const headers = this.getAuthHeaders();
    const apiData = this.convertLocalToApi(peliculaData);
    
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/movies/${id}`, apiData, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Película actualizada');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al actualizar película:', error);
        return of(false);
      })
    );
  }

  /**
   * Eliminar película (solo admin)
   */
  deletePelicula(id: number): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/movies/${id}`, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Película eliminada');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al eliminar película:', error);
        return of(false);
      })
    );
  }

  // ==================== MÉTODOS DE CONVERSIÓN ====================

  /**
   * Convertir película de API a formato local
   */
  private convertApiToLocal(apiPelicula: any): Pelicula {
    return {
      id: apiPelicula.id,
      titulo: apiPelicula.titulo,
      sinopsis: apiPelicula.sinopsis,
      poster: apiPelicula.poster,
      fechaEstreno: apiPelicula.fecha_estreno,
      estudio: apiPelicula.estudio,
      genero: apiPelicula.genero,
      anio: apiPelicula.anio,
      duracion: apiPelicula.duracion,
      rating: parseFloat(apiPelicula.rating?.toString() || '0'),
      director: apiPelicula.director,
      trailer: apiPelicula.trailer,
      idx: apiPelicula.id // Para compatibilidad
    };
  }

  /**
   * Convertir película de formato local a API
   */
  private convertLocalToApi(localPelicula: any): any {
    return {
      titulo: localPelicula.titulo,
      sinopsis: localPelicula.sinopsis,
      poster: localPelicula.poster,
      fecha_estreno: localPelicula.fechaEstreno,
      estudio: localPelicula.estudio,
      genero: localPelicula.genero,
      anio: localPelicula.anio,
      duracion: localPelicula.duracion,
      rating: localPelicula.rating,
      director: localPelicula.director,
      trailer: localPelicula.trailer
    };
  }

  // ==================== MÉTODOS DE AUTENTICACIÓN ====================

  /**
   * Obtener headers con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('⚠️ No hay token de autenticación');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== MÉTODOS LOCALES (FUNCIONES, ASIENTOS, ETC.) ====================

  /**
   * Métodos que mantienen la funcionalidad local existente
   */

  getPelicula(idx: number): Pelicula | null {
    console.warn('⚠️ Método getPelicula() es obsoleto. Usa getPeliculaById()');
    return null;
  }

  getTrailerUrl(pelicula: Pelicula): string {
    if (pelicula && pelicula.trailer) {
      return `https://www.youtube.com/embed/${pelicula.trailer}`;
    }
    return '';
  }

  getProximosEstrenos(): ProximoEstreno[] {
    return this.proximosEstrenos.sort((a, b) => {
      return new Date(a.fechaEstreno).getTime() - new Date(b.fechaEstreno).getTime();
    });
  }

  getProximoEstreno(id: number): ProximoEstreno | null {
    return this.proximosEstrenos.find(estreno => estreno.id === id) || null;
  }

  getFuncionesPelicula(peliculaId: number): FuncionCine[] {
    return this.funcionesCine[peliculaId] || [];
  }

  getFuncion(funcionId: string): FuncionCine | undefined {
    for (const peliculaId in this.funcionesCine) {
      const funcion = this.funcionesCine[peliculaId].find(f => f.id === funcionId);
      if (funcion) return funcion;
    }
    return undefined;
  }

  getSeatMap(salaName: string): SeatMap {
    return this.seatMaps[salaName] || this.seatMaps['default'];
  }

  generateSeatsForFunction(funcionId: string): Seat[] {
    const funcion = this.getFuncion(funcionId);
    if (!funcion) return [];

    const seatMap = this.getSeatMap(funcion.sala);
    const seats: Seat[] = [];

    seatMap.rows.forEach(row => {
      for (let seatNumber = 1; seatNumber <= seatMap.seatsPerRow; seatNumber++) {
        const seatId = `${row}${seatNumber}`;
        const isVip = seatMap.vipRows.includes(row);
        const isDisabled = seatMap.disabledSeats.includes(seatId);
        const isOccupied = seatMap.occupiedSeats.includes(seatId);

        seats.push({
          id: seatId,
          row: row,
          number: seatNumber,
          isVip: isVip,
          isDisabled: isDisabled,
          isOccupied: isOccupied,
          isSelected: false,
          price: isVip ? funcion.precio * 1.5 : funcion.precio
        });
      }
    });

    return seats;
  }

  updateOccupiedSeats(funcionId: string, seatIds: string[]): void {
    const funcion = this.getFuncion(funcionId);
    if (!funcion) return;

    const seatMap = this.getSeatMap(funcion.sala);
    seatMap.occupiedSeats = [...seatMap.occupiedSeats, ...seatIds];
  }

  addFuncionToPelicula(peliculaIndex: number, funcion: Omit<FuncionCine, 'id'>): boolean {
    try {
      const funcionId = `func-${Date.now()}`;
      const nuevaFuncion: FuncionCine = { ...funcion, id: funcionId };

      if (!this.funcionesCine[peliculaIndex]) {
        this.funcionesCine[peliculaIndex] = [];
      }

      this.funcionesCine[peliculaIndex].push(nuevaFuncion);
      console.log('✅ Función agregada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error al agregar función:', error);
      return false;
    }
  }

  deleteFuncion(funcionId: string): boolean {
    try {
      for (const peliculaId in this.funcionesCine) {
        const funciones = this.funcionesCine[peliculaId];
        const funcionIndex = funciones.findIndex(f => f.id === funcionId);
        
        if (funcionIndex !== -1) {
          funciones.splice(funcionIndex, 1);
          console.log('✅ Función eliminada exitosamente');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error al eliminar función:', error);
      return false;
    }
  }

  // ==================== VALIDACIÓN ====================

  validatePeliculaData(pelicula: Partial<Pelicula>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pelicula.titulo?.trim()) errors.push('El título es requerido');
    if (!pelicula.director?.trim()) errors.push('El director es requerido');
    if (!pelicula.sinopsis?.trim()) errors.push('La sinopsis es requerida');
    if (!pelicula.genero?.trim()) errors.push('El género es requerido');
    if (!pelicula.anio || pelicula.anio < 1900 || pelicula.anio > new Date().getFullYear() + 5) {
      errors.push('El año debe ser válido');
    }
    if (!pelicula.rating || pelicula.rating < 0 || pelicula.rating > 10) {
      errors.push('El rating debe estar entre 0 y 10');
    }
    if (!pelicula.poster?.trim()) errors.push('La URL del poster es requerida');
    if (!pelicula.fechaEstreno?.trim()) errors.push('La fecha de estreno es requerida');
    if (!pelicula.duracion?.trim()) errors.push('La duración es requerida');

    return { valid: errors.length === 0, errors };
  }
}

// ==================== INTERFACES ====================

export interface Pelicula {
  id?: number;          // ID de la base de datos
  idx?: number;         // Para compatibilidad con código existente
  titulo: string;
  sinopsis: string;
  poster: string;
  fechaEstreno: string;
  estudio: string;
  genero: string;
  anio: number;
  duracion: string;
  rating: number;
  director: string;
  trailer?: string;
}

export interface FuncionCine {
  id: string;
  fecha: string;
  hora: string;
  sala: string;
  precio: number;
  asientosDisponibles: number;
  formato: string;
}

export interface SeatMap {
  rows: string[];
  seatsPerRow: number;
  vipRows: string[];
  disabledSeats: string[];
  occupiedSeats: string[];
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  isVip: boolean;
  isDisabled: boolean;
  isOccupied: boolean;
  isSelected: boolean;
  price: number;
}

export interface ProximoEstreno {
  id: number;
  titulo: string;
  sinopsis: string;
  poster: string;
  fechaEstreno: string;
  estudio: string;
  genero: string;
  director: string;
  trailer: string;
  duracion: string;
  actores: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
  error?: string;
}