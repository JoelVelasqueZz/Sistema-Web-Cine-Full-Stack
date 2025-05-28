import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MovieService {

  private peliculas: Pelicula[] = [
    {
      titulo: "Avatar: El Camino del Agua",
      sinopsis: "Ambientada más de una década después de los acontecimientos de la primera película, 'Avatar: El camino del agua' empieza contando la historia de la familia Sully (Jake, Neytiri y sus hijos), los problemas que los persiguen, lo que tienen que hacer para mantenerse a salvo, las batallas que luchan para seguir con vida y las tragedias que sufren.",
      poster: "assets/movies/avatar.png",
      fechaEstreno: "2022-12-16",
      estudio: "assets/studios/disney.png",
      genero: "Aventura",
      anio: 2022,
      duracion: "3h 12min",
      rating: 8.1,
      director: "James Cameron",
      trailer: "kPMi_VxqcUc" // Avatar: The Way of Water Trailer
    },
    {
      titulo: "Top Gun: Maverick",
      sinopsis: "Después de más de 30 años de servicio como uno de los mejores aviadores de la Armada, Pete 'Maverick' Mitchell se encuentra dónde siempre perteneció, empujando los límites como un valiente piloto de prueba y esquivando el avance en rango que lo pondría en tierra.",
      poster: "assets/movies/topgun.png",
      fechaEstreno: "2022-05-27",
      estudio: "assets/studios/paramount.png",
      genero: "Acción",
      anio: 2022,
      duracion: "2h 11min",
      rating: 8.3,
      director: "Joseph Kosinski",
      trailer: "1w2P46uub7M" // Top Gun: Maverick Trailer
    },
    {
      titulo: "Black Panther: Wakanda Forever",
      sinopsis: "La reina Ramonda, Shuri, M'Baku, Okoye y las Dora Milaje luchan para proteger su nación de las potencias mundiales que intervienen tras la muerte del rey T'Challa. Mientras los wakandanos se esfuerzan por abrazar su próximo capítulo, los héroes deben unirse con la ayuda de War Dog Nakia y Everett Ross para forjar un nuevo camino para el reino de Wakanda.",
      poster: "assets/movies/blackpanter2.png",
      fechaEstreno: "2022-11-11",
      estudio: "assets/studios/marvel.png",
      genero: "Acción",
      anio: 2022,
      duracion: "2h 41min",
      rating: 7.8,
      director: "Ryan Coogler",
      trailer: "hpT-11DMqVs" // Black Panther: Wakanda Forever Trailer
    },
    {
      titulo: "The Batman",
      sinopsis: "Cuando un asesino se dirige a la élite de Gotham con una serie de maquinaciones sádicas, un rastro de pistas crípticas envía Batman a una investigación en los bajos fondos. A medida que las pruebas comienzan a acercarse a su casa y se hace evidente la magnitud de los planes del perpetrador, Batman debe forjar nuevas relaciones, desenmascarar al culpable y hacer justicia al abuso de poder y la corrupción que durante mucho tiempo han plagado Gotham City.",
      poster: "assets/movies/batman.png",
      fechaEstreno: "2022-03-04",
      estudio: "assets/studios/warner.png",
      genero: "Acción",
      anio: 2022,
      duracion: "2h 56min",
      rating: 7.9,
      director: "Matt Reeves",
      trailer: "YNl8yV8oPZM" // The Batman Trailer
    },
    {
      titulo: "Spider-Man: No Way Home",
      sinopsis: "Peter Parker es desenmascarado y ya no puede separar su vida normal de los enormes riesgos de ser un superhéroe. Cuando le pide ayuda a Doctor Strange, los riesgos se vuelven aún más peligrosos, obligándolo a descubrir lo que realmente significa ser Spider-Man.",
      poster: "assets/movies/spiderman.png",
      fechaEstreno: "2021-12-17",
      estudio: "assets/studios/sony.png",
      genero: "Acción",
      anio: 2021,
      duracion: "2h 28min",
      rating: 8.4,
      director: "Jon Watts",
      trailer: "z70zo9gQUKA" // Spider-Man: No Way Home Trailer
    },
    {
      titulo: "Dune",
      sinopsis: "Una épica aventura e historia emocionalmente cargada, 'Dune' cuenta la historia de Paul Atreides, un joven brillante y talentoso nacido con un gran destino que está más allá de su comprensión, que debe viajar al planeta más peligroso del universo para asegurar el futuro de su familia y su gente.",
      poster: "assets/movies/dune.png",
      fechaEstreno: "2021-10-22",
      estudio: "assets/studios/warner.png",
      genero: "Ciencia Ficción",
      anio: 2021,
      duracion: "2h 35min",
      rating: 8.0,
      director: "Denis Villeneuve",
      trailer: "ndStFxq8zfU" // Dune Trailer
    },
    {
      titulo: "Scream",
      sinopsis: "Veinticinco años después de una serie de brutales asesinatos que conmocionaron a la tranquila ciudad de Woodsboro, un nuevo asesino se pone la máscara de Ghostface y comienza a perseguir a un grupo de adolescentes para resucitar secretos del pasado mortal de la ciudad.",
      poster: "assets/movies/scream.png",
      fechaEstreno: "2022-01-14",
      estudio: "assets/studios/paramount.png",
      genero: "Terror",
      anio: 2022,
      duracion: "1h 54min",
      rating: 7.2,
      director: "Matt Bettinelli-Olpin",
      trailer: "RZveBrcxXqA" // Scream (2022) Trailer
    },
    {
      titulo: "Encanto",
      sinopsis: "La película de Walt Disney Animation Studios 'Encanto' cuenta la historia de los Madrigal, una familia extraordinaria que vive escondida en las montañas de Colombia, en una casa mágica, en un pueblo vibrante, en un lugar maravilloso conocido como un Encanto.",
      poster: "assets/movies/encanto.png",
      fechaEstreno: "2021-11-24",
      estudio: "assets/studios/disney.png",
      genero: "Animación",
      anio: 2021,
      duracion: "1h 42min",
      rating: 7.3,
      director: "Jared Bush",
      trailer: "SAH_W9q_brE" // Encanto Trailer
    },
    {
      titulo: "Oppenheimer",
      sinopsis: "Ambientada durante la Segunda Guerra Mundial, la película narra la vida y carrera de J. Robert Oppenheimer, el físico teórico estadounidense que lideró el Proyecto Manhattan, el programa secreto encargado de desarrollar la primera bomba atómica. A través de una narrativa intensa y profundamente introspectiva, se exploran sus dilemas morales, su relación con figuras clave como Albert Einstein, Niels Bohr y el gobierno de los Estados Unidos, así como las consecuencias personales y sociales que acarrearon sus descubrimientos. Enfrentado a un juicio político posterior por sus vínculos pasados con el comunismo, Oppenheimer es retratado como un hombre brillante pero atormentado por el peso de haber creado el arma más destructiva jamás concebida.",
      poster: "assets/movies/oppenheimer.png",
      fechaEstreno: "2023-07-21",
      estudio: "assets/studios/universal.png",
      genero: "Drama",
      anio: 2023,
      duracion: "3h 0min",
      rating: 8.6,
      director: "Christopher Nolan",
      trailer: "gMPEbJQun68" // Oppenheimer Trailer
    },
    {
      titulo: "Barbie",
      sinopsis: "En Barbieland, un mundo utópico donde todas las versiones de Barbie y Ken viven en armonía, la Barbie estereotípica comienza a experimentar cambios inusuales: pensamientos existenciales, pies planos y una creciente desconexión con su entorno. Obligada a abandonar su idílico hogar, se aventura al mundo real junto a Ken para descubrir la causa de su 'mal funcionamiento'. En su travesía, se enfrenta a la dura realidad del patriarcado, la inseguridad personal y la complejidad de las emociones humanas. Mientras Ken adopta ideas del mundo real para instaurar un nuevo orden en Barbieland, Barbie descubre que su valor no depende de su apariencia, sino de su capacidad de sentir, pensar y evolucionar. Una sátira brillante y visualmente vibrante sobre la identidad, el empoderamiento y lo que realmente significa ser humano.",
      poster: "assets/movies/barbie.png",
      fechaEstreno: "2023-07-21",
      estudio: "assets/studios/warner.png",
      genero: "Comedia",
      anio: 2023,
      duracion: "1h 54min",
      rating: 7.2,
      director: "Greta Gerwig",
      trailer: "gH2mRECr6y4" // Barbie Trailer
    },
    {
      titulo: "The Flash",
      sinopsis: "Cuando Barry Allen descubre que puede viajar en el tiempo utilizando la Fuerza de la Velocidad, decide retroceder para evitar la muerte de su madre, un evento que marcó su vida para siempre. Sin embargo, al alterar el pasado, crea una línea temporal alternativa donde los metahumanos casi no existen, Superman nunca llegó a la Tierra y el General Zod amenaza con destruir el planeta sin nadie que lo detenga. En su intento por restaurar el equilibrio, Barry recluta a una versión más joven de sí mismo, a una Supergirl prisionera y a un envejecido Bruce Wayne, retirado como Batman. Esta misión lo obligará a enfrentarse no solo a enemigos externos, sino también a las consecuencias emocionales y éticas de alterar el tiempo.",
      poster: "assets/movies/flash.png",
      fechaEstreno: "2023-06-16",
      estudio: "assets/studios/warner.png",
      genero: "Acción",
      anio: 2023,
      duracion: "2h 24min",
      rating: 6.8,
      director: "Andy Muschietti",
      trailer: "w9s5B9EmMJw" // The Flash Trailer
    },
    {
      titulo: "Elemental",
      sinopsis: "En Ciudad Elemento, un lugar fantástico donde conviven los cuatro elementos fundamentales de la naturaleza —fuego, agua, tierra y aire—, Ember, una joven fogosa, y Wade, un chico de agua emocional y empático, inician una improbable amistad que desafía las reglas establecidas de su mundo. Mientras tratan de descubrir por qué la infraestructura de la ciudad comienza a fallar y qué secretos esconde su historia, ambos comienzan a darse cuenta de que, a pesar de sus diferencias elementales, tienen mucho más en común de lo que parece. A través de una historia conmovedora sobre inclusión, identidad y aceptación, 'Elemental' celebra las conexiones inesperadas que cambian la vida para siempre.",
      poster: "assets/movies/elemental.png",
      fechaEstreno: "2023-06-16",
      estudio: "assets/studios/disney.png",
      genero: "Animación",
      anio: 2023,
      duracion: "1h 49min",
      rating: 7.0,
      director: "Peter Sohn",
      trailer: "FoSVZxVOmb4" // Elemental Trailer
    },
    {
      titulo: "John Wick 4",
      sinopsis: "Con la organización criminal conocida como la Alta Mesa pisándole los talones, John Wick regresa más letal que nunca en su lucha por la libertad definitiva. A medida que la recompensa por su cabeza aumenta, Wick se embarca en una cruzada global desde Nueva York hasta París, Osaka y Berlín, enfrentando a asesinos implacables y antiguos aliados convertidos en enemigos. Con nuevas reglas, nuevos códigos de honor y batallas tan espectaculares como brutales, la saga alcanza su punto culminante en esta cuarta entrega. Mientras el reloj avanza, John descubre que el precio de la libertad puede ser más alto de lo que nunca imaginó.",
      poster: "assets/movies/johnwick4.png",
      fechaEstreno: "2023-03-24",
      estudio: "assets/studios/lionsgate.png",
      genero: "Acción",
      anio: 2023,
      duracion: "2h 49min",
      rating: 8.2,
      director: "Chad Stahelski",
      trailer: "8ubRKDsM1FI" // John Wick: Chapter 4 Trailer
    }
  ];

  // FUNCIONES DE CINE PARA CADA PELÍCULA (usar índices del array)
  private funcionesCine: { [peliculaId: number]: FuncionCine[] } = {
    0: [ // Avatar: El Camino del Agua
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
      },
      {
        id: 'av2-003',
        fecha: '2024-12-21',
        hora: '20:15',
        sala: 'Sala 1 - IMAX',
        precio: 12.50,
        asientosDisponibles: 28,
        formato: 'IMAX 3D'
      }
    ],
    1: [ // Top Gun: Maverick
      {
        id: 'tg-001',
        fecha: '2024-12-20',
        hora: '16:00',
        sala: 'Sala 3',
        precio: 9.00,
        asientosDisponibles: 38,
        formato: '2D'
      },
      {
        id: 'tg-002',
        fecha: '2024-12-20',
        hora: '19:30',
        sala: 'Sala 3',
        precio: 9.00,
        asientosDisponibles: 25,
        formato: '2D'
      }
    ],
    2: [ // Black Panther: Wakanda Forever
      {
        id: 'bp-001',
        fecha: '2024-12-20',
        hora: '15:15',
        sala: 'Sala 4',
        precio: 8.50,
        asientosDisponibles: 42,
        formato: '2D'
      },
      {
        id: 'bp-002',
        fecha: '2024-12-21',
        hora: '21:00',
        sala: 'Sala 4',
        precio: 10.00,
        asientosDisponibles: 35,
        formato: '3D'
      }
    ],
    3: [ // The Batman
      {
        id: 'bat-001',
        fecha: '2024-12-20',
        hora: '18:00',
        sala: 'Sala 5',
        precio: 9.50,
        asientosDisponibles: 40,
        formato: '2D'
      },
      {
        id: 'bat-002',
        fecha: '2024-12-21',
        hora: '22:30',
        sala: 'Sala 5',
        precio: 9.50,
        asientosDisponibles: 35,
        formato: '2D'
      }
    ],
    4: [ // Spider-Man: No Way Home
      {
        id: 'sp-001',
        fecha: '2024-12-20',
        hora: '16:30',
        sala: 'Sala 6',
        precio: 10.50,
        asientosDisponibles: 30,
        formato: '3D'
      },
      {
        id: 'sp-002',
        fecha: '2024-12-20',
        hora: '19:45',
        sala: 'Sala 6',
        precio: 8.50,
        asientosDisponibles: 25,
        formato: '2D'
      }
    ],
    5: [ // Dune
      {
        id: 'du-001',
        fecha: '2024-12-20',
        hora: '17:00',
        sala: 'Sala 7 - IMAX',
        precio: 11.50,
        asientosDisponibles: 50,
        formato: 'IMAX'
      }
    ],
    6: [ // Scream
      {
        id: 'sc-001',
        fecha: '2024-12-20',
        hora: '22:00',
        sala: 'Sala 8',
        precio: 8.50,
        asientosDisponibles: 35,
        formato: '2D'
      }
    ],
    7: [ // Encanto
      {
        id: 'en-001',
        fecha: '2024-12-20',
        hora: '14:00',
        sala: 'Sala 9',
        precio: 7.50,
        asientosDisponibles: 50,
        formato: '2D'
      }
    ],
    8: [ // Oppenheimer
      {
        id: 'op-001',
        fecha: '2024-12-20',
        hora: '19:00',
        sala: 'Sala 10 - Premium',
        precio: 13.00,
        asientosDisponibles: 28,
        formato: '70mm IMAX'
      },
      {
        id: 'op-002',
        fecha: '2024-12-21',
        hora: '15:30',
        sala: 'Sala 10 - Premium',
        precio: 13.00,
        asientosDisponibles: 32,
        formato: '70mm IMAX'
      }
    ],
    9: [ // Barbie
      {
        id: 'bar-001',
        fecha: '2024-12-20',
        hora: '14:00',
        sala: 'Sala 11',
        precio: 8.00,
        asientosDisponibles: 45,
        formato: '2D'
      },
      {
        id: 'bar-002',
        fecha: '2024-12-20',
        hora: '16:45',
        sala: 'Sala 11',
        precio: 8.00,
        asientosDisponibles: 38,
        formato: '2D'
      }
    ],
    10: [ // The Flash
      {
        id: 'fl-001',
        fecha: '2024-12-20',
        hora: '20:30',
        sala: 'Sala 12',
        precio: 9.00,
        asientosDisponibles: 40,
        formato: '2D'
      }
    ],
    11: [ // Elemental
      {
        id: 'el-001',
        fecha: '2024-12-20',
        hora: '15:00',
        sala: 'Sala 13',
        precio: 8.00,
        asientosDisponibles: 42,
        formato: '2D'
      }
    ],
    12: [ // John Wick 4
      {
        id: 'jw-001',
        fecha: '2024-12-20',
        hora: '21:30',
        sala: 'Sala 14',
        precio: 9.50,
        asientosDisponibles: 35,
        formato: '2D'
      }
    ]
  };
  private seatMaps: { [salaId: string]: SeatMap } = {
  'Sala 1 - IMAX': {
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 12,
    vipRows: ['E', 'F'], // Filas VIP
    disabledSeats: ['A1', 'A12', 'H1', 'H12'], // Asientos no disponibles
    occupiedSeats: [] // Se actualizará dinámicamente
  },
  'Sala 2': {
    rows: ['A', 'B', 'C', 'D', 'E', 'F'],
    seatsPerRow: 10,
    vipRows: ['D', 'E'],
    disabledSeats: [],
    occupiedSeats: ['C5', 'C6', 'D7'] // Asientos ya ocupados
  },
  'Sala 3': {
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    seatsPerRow: 10,
    vipRows: ['E', 'F'],
    disabledSeats: ['A1', 'A10'],
    occupiedSeats: ['B3', 'B4', 'E5', 'E6', 'F5', 'F6']
  },
  // Configuración por defecto para otras salas
  'default': {
    rows: ['A', 'B', 'C', 'D', 'E', 'F'],
    seatsPerRow: 10,
    vipRows: ['D', 'E'],
    disabledSeats: [],
    occupiedSeats: []
  }
};
  

getSeatMap(salaName: string): SeatMap {
  return this.seatMaps[salaName] || this.seatMaps['default'];
}

// GENERAR ASIENTOS PARA UNA FUNCIÓN
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
        price: isVip ? funcion.precio * 1.5 : funcion.precio // VIP cuesta 50% más
      });
    }
  });

  return seats;
}

// ACTUALIZAR ASIENTOS OCUPADOS (simular reserva)
updateOccupiedSeats(funcionId: string, seatIds: string[]): void {
  const funcion = this.getFuncion(funcionId);
  if (!funcion) return;

  const seatMap = this.getSeatMap(funcion.sala);
  seatMap.occupiedSeats = [...seatMap.occupiedSeats, ...seatIds];
}

  constructor() {
    console.log('Servicio de películas listo para usar!');
  }

  getPeliculas(): Pelicula[] {
    return this.peliculas;
  }

  getPelicula(idx: number): Pelicula {
    return this.peliculas[idx];
  }

  // Método para obtener la URL del trailer
  getTrailerUrl(idx: number): string {
    const pelicula = this.peliculas[idx];
    if (pelicula && pelicula.trailer) {
      return `https://www.youtube.com/embed/${pelicula.trailer}`;
    }
    return '';
  }

  buscarPeliculas(termino: string): Pelicula[] {
    console.log('Buscando término:', termino);
    
    termino = termino.toLowerCase();
    let peliculasArr: Pelicula[] = [];

    for (let i = 0; i < this.peliculas.length; i++) {
      let pelicula = this.peliculas[i];
      let titulo = pelicula.titulo.toLowerCase();

      console.log(`Comparando "${titulo}" con "${termino}": ${titulo.indexOf(termino) >= 0}`);

      if (titulo.indexOf(termino) >= 0) {
        const peliculaCopy = {
          ...pelicula,
          idx: i
        };
        peliculasArr.push(peliculaCopy);
      }
    }

    console.log('Resultados encontrados:', peliculasArr.length);
    return peliculasArr;
  }

  // OBTENER FUNCIONES DE UNA PELÍCULA
  getFuncionesPelicula(peliculaId: number): FuncionCine[] {
    return this.funcionesCine[peliculaId] || [];
  }

  // OBTENER FUNCIÓN ESPECÍFICA
  getFuncion(funcionId: string): FuncionCine | undefined {
    for (const peliculaId in this.funcionesCine) {
      const funcion = this.funcionesCine[peliculaId].find(f => f.id === funcionId);
      if (funcion) return funcion;
    }
    return undefined;
  }

  // OBTENER FUNCIONES DE HOY
  getFuncionesHoy(): { pelicula: Pelicula, funciones: FuncionCine[] }[] {
    const hoy = new Date().toISOString().split('T')[0];
    const funcionesHoy: { pelicula: Pelicula, funciones: FuncionCine[] }[] = [];

    for (const peliculaId in this.funcionesCine) {
      const pelicula = this.getPelicula(parseInt(peliculaId));
      const funciones = this.funcionesCine[peliculaId].filter(f => f.fecha === hoy);
      
      if (pelicula && funciones.length > 0) {
        funcionesHoy.push({ pelicula, funciones });
      }
    }

    return funcionesHoy;
  }
}

export interface Pelicula {
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
  trailer?: string; // ID del video de YouTube (opcional)
  idx?: number;
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
  id: string;           // Ej: "A5", "B3"
  row: string;          // Ej: "A", "B"
  number: number;       // Ej: 1, 2, 3
  isVip: boolean;       // Asiento VIP
  isDisabled: boolean;  // No disponible
  isOccupied: boolean;  // Ya ocupado
  isSelected: boolean;  // Seleccionado por el usuario
  price: number;        // Precio del asiento
}