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
      trailer: "zh4KhVSMwtQ" // Barbie Trailer
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
    },
    {
  titulo: "Titanic",
  sinopsis: "En abril de 1912, Rose DeWitt Bukater, una joven de clase alta de 17 años, aborda el Titanic con su prometido Cal Hockley y su madre Ruth. Atrapada en un compromiso que no desea, Rose contempla el suicidio hasta que conoce a Jack Dawson, un artista bohemio que ganó su boleto en una partida de póker. A pesar de las diferencias de clase social, Jack y Rose se enamoran profundamente. Su historia de amor se desarrolla contra el telón de fondo del 'barco insumergible' durante su viaje inaugural de Southampton a Nueva York. Sin embargo, el destino les tiene preparado un trágico final cuando el Titanic choca contra un iceberg en la madrugada del 15 de abril. En medio del caos y la tragedia, Jack y Rose luchan por estar juntos mientras el barco se hunde lentamente en las heladas aguas del Atlántico Norte.",
  poster: "assets/movies/titanic.png",
  fechaEstreno: "1997-12-19",
  estudio: "assets/studios/paramount.png",
  genero: "Romance",
  anio: 1997,
  duracion: "3h 14min",
  rating: 7.9,
  director: "James Cameron",
  trailer: "1EMkCJWQIDY"
},
{
  titulo: "El Señor de los Anillos: La Comunidad del Anillo",
  sinopsis: "En la Tierra Media, el hobbit Frodo Bolsón hereda un anillo mágico de su tío Bilbo. El mago Gandalf le revela que este es el Anillo Único, forjado por el Señor Oscuro Sauron para controlar todos los demás Anillos de Poder. Para destruir el mal para siempre, Frodo debe llevar el Anillo a través de la Tierra Media hasta las llamas del Monte del Destino, donde fue forjado. Acompañado por sus fieles amigos hobbits Sam, Merry y Pippin, y guiado por el misterioso Aragorn, Frodo se embarca en una épica aventura. En el Concilio de Elrond en Rivendel, se forma la Comunidad del Anillo: Frodo, sus amigos hobbits, Gandalf, Aragorn, el elfo Legolas, el enano Gimli y Boromir de Gondor. Juntos, deben enfrentar peligros inimaginables, desde orcos y trolls hasta la traición y la tentación del poder del Anillo, en una misión que determinará el destino de toda la Tierra Media.",
  poster: "assets/movies/lotr1.png",
  fechaEstreno: "2001-12-19",
  estudio: "assets/studios/warner.png",
  genero: "Fantasía",
  anio: 2001,
  duracion: "2h 58min",
  rating: 8.8,
  director: "Peter Jackson",
  trailer: "AK0L4xvNgkU"
},
{
  titulo: "El Sexto Sentido",
  sinopsis: "Malcolm Crowe es un psicólogo infantil de renombre en Filadelfia que comienza a tratar a Cole Sear, un niño de ocho años que es perturbado y retraído. Cole vive aterrorizado por un secreto sobrenatural: puede ver y comunicarse con personas muertas que no saben que han fallecido. Estas apariciones lo visitan constantemente, buscando su ayuda para resolver asuntos pendientes. Malcolm, inicialmente escéptico, comienza a creer en las habilidades del niño a medida que desarrollan una relación de confianza. Mientras intenta ayudar a Cole a lidiar con su don y encontrar paz, Malcolm también lucha con sus propios demonios personales y profesionales. La historia se desarrolla como un misterio psicológico profundo, explorando temas de muerte, aceptación y redención. A medida que Cole aprende a no temer su habilidad, sino a usarla para ayudar a los espíritus en pena, tanto él como Malcolm descubren verdades que cambiarán sus vidas para siempre.",
  poster: "assets/movies/sixthsense.png",
  fechaEstreno: "1999-08-06",
  estudio: "assets/studios/disney.png",
  genero: "Misterio",
  anio: 1999,
  duracion: "1h 47min",
  rating: 8.2,
  director: "M. Night Shyamalan",
  trailer: "VG9AGf66tXM"
},
{
  titulo: "La La Land",
  sinopsis: "En Los Ángeles, Sebastian es un pianista de jazz que lucha por mantener vivo el género musical que ama, mientras trabaja en cafeterías entre audiciones. Mia es una actriz aspirante que sirve café a las estrellas de cine entre audiciones fallidas. Cuando sus caminos se cruzan, se enamoran perdidamente, pero mientras sus carreras los llevan en diferentes direcciones, deben enfrentar decisiones desgarradoras que pondrán a prueba su relación. A través de elaboradas secuencias musicales y coreografías, la película celebra los sueños y el amor mientras explora el costo de perseguir la grandeza artística. En una ciudad conocida por destruir esperanzas y romper corazones, Sebastian y Mia deben decidir si su amor puede sobrevivir a las presiones de Hollywood y sus ambiciones personales. Con números musicales deslumbrantes ambientados en icónicas locaciones de Los Ángeles, desde las colinas de Hollywood hasta el observatorio Griffith, la película es un homenaje tanto al cine clásico como a los soñadores modernos.",
  poster: "assets/movies/lalaland.png",
  fechaEstreno: "2016-12-09",
  estudio: "assets/studios/lionsgate.png",
  genero: "Romance",
  anio: 2016,
  duracion: "2h 8min",
  rating: 8.0,
  director: "Damien Chazelle",
  trailer: "0pdqf4P9MB8"
},
{
  titulo: "Harry Potter y la Piedra Filosofal",
  sinopsis: "Harry Potter ha vivido bajo las escaleras en casa de sus terribles tíos, los Dursley, durante diez años. Su cumpleaños número 11, Harry descubre que es un mago poderoso con un lugar esperándolo en el Colegio Hogwarts de Magia y Hechicería. Hagrid, el guardián de llaves de Hogwarts, le revela que sus padres fueron asesinados por el malvado mago Voldemort, y que Harry sobrevivió milagrosamente, ganándose el apodo de 'El Niño que Vivió'. En Hogwarts, Harry hace sus primeros amigos verdaderos, Hermione Granger y Ron Weasley, mientras aprende sobre el mundo mágico que nunca supo que existía. Junto a sus nuevos amigos, Harry descubre sus talentos naturales para el vuelo en escoba y se convierte en el buscador más joven en siglos para el equipo de Quidditch de Gryffindor. Sin embargo, algo malévolo se esconde en los pasillos del colegio, y Harry y sus amigos deben proteger la Piedra Filosofal de quien busca usarla para regresar al poder.",
  poster: "assets/movies/harrypotter1.png",
  fechaEstreno: "2001-11-16",
  estudio: "assets/studios/warner.png",
  genero: "Fantasía",
  anio: 2001,
  duracion: "2h 32min",
  rating: 7.6,
  director: "Chris Columbus",
  trailer: "VyHV0BRtdxo"
},
{
  titulo: "Zodiac",
  sinopsis: "Basada en hechos reales, la película narra la investigación del asesino en serie conocido como 'Zodiac', que aterrorizó el área de la Bahía de San Francisco entre finales de los años 60 y principios de los 70. El cartógrafo Robert Graysmith se obsesiona con descifrar los crípticos mensajes cifrados que el asesino envía a los periódicos locales. Junto al inspector Dave Toschi y el reportero del San Francisco Chronicle Paul Avery, Graysmith se sumerge en una investigación que consumirá años de su vida. A medida que los cuerpos se acumulan y las pistas se vuelven más esquivas, la investigación se convierte en una obsesión peligrosa que afecta la salud mental y las relaciones personales de todos los involucrados. El asesino se burla de la policía y los medios con cartas cifradas, llamadas telefónicas amenazantes y una serie de asesinatos aparentemente aleatorios. La película explora la naturaleza obsesiva de la investigación criminal y el costo personal de buscar la verdad cuando el caso permanece sin resolver durante décadas.",
  poster: "assets/movies/zodiac.png",
  fechaEstreno: "2007-03-02",
  estudio: "assets/studios/paramount.png",
  genero: "Misterio",
  anio: 2007,
  duracion: "2h 37min",
  rating: 7.7,
  director: "David Fincher",
  trailer: "yNncHPl1UXg"
},
];

  private proximosEstrenos: ProximoEstreno[] = [
  // === JUNIO 2025 ===
  {
    id: 1,
    titulo: "Kayara: La Princesa Inca",
    sinopsis: "Una épica aventura que narra la historia de Kayara, una valiente princesa inca que debe salvar su reino de una amenaza ancestral. Entre tradiciones milenarias y poderes místicos, ella descubrirá su verdadero destino mientras lucha por proteger a su pueblo y preservar la sabiduría de sus antepasados.",
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
    sinopsis: "Elio, un niño soñador y fanático del espacio, es confundido accidentalmente con el representante intergaláctico de la Tierra y transportado al Comuniverso, una organización de seres extraterrestres. Ahora debe demostrar que la humanidad merece su lugar en el cosmos.",
    poster: "assets/movies/elio.png",
    fechaEstreno: "2025-06-13",
    estudio: "assets/studios/disney.png",
    genero: "Animación",
    director: "Adrian Molina",
    trailer: "QkA4XR5GUos",
    duracion: "1h 35min",
    actores: ["Yonas Kibreab", "Zoe Saldaña", "Remy Edgerly", "Brad Garrett"]
  },
  {
    id: 3,
    titulo: "Cómo Entrenar a tu Dragón",
    sinopsis: "La adaptación en acción real de la querida historia animada. Hiccup, un joven vikingo poco convencional, descubre una amistad inesperada con Toothless, un dragón Furia Nocturna herido. Juntos cambiarán para siempre la relación entre humanos y dragones en la isla de Berk.",
    poster: "assets/movies/dragon.png",
    fechaEstreno: "2025-06-20",
    estudio: "assets/studios/universal.png",
    genero: "Aventura",
    director: "Dean DeBlois",
    trailer: "liGB1ssYn38",
    duracion: "2h 15min",
    actores: ["Mason Thames", "Nico Parker", "Gerard Butler", "Nick Frost"]
  },
  {
    id: 4,
    titulo: "Amor En La Gran Ciudad",
    sinopsis: "Una comedia romántica contemporánea que sigue las vidas entrelazadas de varias parejas en una metrópoli moderna. Entre citas por aplicaciones, encuentros casuales y segundas oportunidades, descubrirán que el amor verdadero puede encontrarse en los lugares más inesperados.",
    poster: "assets/movies/amor.png",
    fechaEstreno: "2025-06-27",
    estudio: "assets/studios/sony.png",
    genero: "Romance",
    director: "Nancy Meyers",
    trailer: "cZIRfrrI5OA",
    duracion: "1h 55min",
    actores: ["Emma Stone", "Ryan Gosling", "Regina King", "Michael Cera"]
  },
  {
    id: 5,
    titulo: "Entre Plumas y Picos",
    sinopsis: "Una divertida aventura animada que sigue a un grupo de aves urbanas que deben trabajar juntas para salvar su hogar en el parque central de la ciudad. Con humor inteligente y un mensaje ecológico, descubrirán el poder de la comunidad y la amistad.",
    poster: "assets/movies/picos.png",
    fechaEstreno: "2025-06-27",
    estudio: "assets/studios/disney.png",
    genero: "Animación",
    director: "Rich Moore",
    trailer: "nCOXDyzoEP0",
    duracion: "1h 28min",
    actores: ["Tina Fey", "Pedro Pascal", "Awkwafina", "Danny DeVito"]
  },

  // === JULIO 2025 ===
  {
    id: 6,
    titulo: "Jurassic World: El Renacer",
    sinopsis: "Una nueva era comienza cuando los dinosaurios y los humanos deben aprender a coexistir en un mundo cambiado para siempre. Cuando una expedición científica descubre una especie prehistórica que podría reescribir la historia de la evolución, deberán enfrentar peligros ancestrales y dilemas éticos modernos.",
    poster: "assets/movies/jurassic.png",
    fechaEstreno: "2025-07-02",
    estudio: "assets/studios/universal.png",
    genero: "Aventura",
    director: "Gareth Edwards",
    trailer: "Xx74GxwtNOE",
    duracion: "2h 27min",
    actores: ["Scarlett Johansson", "Jonathan Bailey", "Mahershala Ali", "Rupert Friend"]
  },
  {
    id: 7,
    titulo: "Los 4 Fantásticos: Primeros Pasos",
    sinopsis: "Reed Richards, Sue Storm, Johnny Storm y Ben Grimm se embarcan en una peligrosa misión espacial que alterará sus vidas para siempre. Cuando adquieren poderes extraordinarios tras exponerse a rayos cósmicos, deberán aprender a trabajar en equipo para proteger la Tierra de amenazas que van más allá de su comprensión.",
    poster: "assets/movies/fantasticos.png",
    fechaEstreno: "2025-07-25",
    estudio: "assets/studios/marvel.png",
    genero: "Acción",
    director: "Matt Shakman",
    trailer: "wgwo9MB0Tk4",
    duracion: "2h 20min",
    actores: ["Pedro Pascal", "Vanessa Kirby", "Joseph Quinn", "Ebon Moss-Bachrach"]
  },

  // === OCTUBRE 2025 ===
  {
    id: 8,
    titulo: "Tron: Ares",
    sinopsis: "Un programa altamente sofisticado llamado Ares es enviado del mundo digital al mundo real en una peligrosa misión. Esta nueva entrega de la saga Tron explora las consecuencias cuando la inteligencia artificial traspasa las barreras entre lo digital y lo físico, amenazando con cambiar ambos mundos para siempre.",
    poster: "assets/movies/tron.png",
    fechaEstreno: "2025-10-10",
    estudio: "assets/studios/disney.png",
    genero: "Ciencia Ficción",
    director: "Joachim Rønning",
    trailer: "asnVBRyndiI",
    duracion: "2h 05min",
    actores: ["Jared Leto", "Greta Lee", "Evan Peters", "Hasan Minhaj"]
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
    ],
    13: [ // Titanic
  {
    id: 'tit-001',
    fecha: '2024-12-20',
    hora: '18:30',
    sala: 'Sala 15 - Premium',
    precio: 11.00,
    asientosDisponibles: 40,
    formato: '2D Remasterizado'
  },
  {
    id: 'tit-002',
    fecha: '2024-12-21',
    hora: '14:00',
    sala: 'Sala 15 - Premium',
    precio: 11.00,
    asientosDisponibles: 45,
    formato: '2D Remasterizado'
  }
],
14: [ // El Señor de los Anillos: La Comunidad del Anillo
  {
    id: 'lotr-001',
    fecha: '2024-12-20',
    hora: '16:00',
    sala: 'Sala 16 - IMAX',
    precio: 12.00,
    asientosDisponibles: 48,
    formato: 'IMAX Extendida'
  },
  {
    id: 'lotr-002',
    fecha: '2024-12-21',
    hora: '19:30',
    sala: 'Sala 16 - IMAX',
    precio: 12.00,
    asientosDisponibles: 35,
    formato: 'IMAX Extendida'
  }
],
15: [ // El Sexto Sentido
  {
    id: 'six-001',
    fecha: '2024-12-20',
    hora: '21:00',
    sala: 'Sala 17',
    precio: 8.50,
    asientosDisponibles: 30,
    formato: '2D'
  },
  {
    id: 'six-002',
    fecha: '2024-12-21',
    hora: '23:00',
    sala: 'Sala 17',
    precio: 8.50,
    asientosDisponibles: 25,
    formato: '2D'
  }
],
16: [ // La La Land
  {
    id: 'lala-001',
    fecha: '2024-12-20',
    hora: '17:15',
    sala: 'Sala 18',
    precio: 9.00,
    asientosDisponibles: 42,
    formato: '2D'
  },
  {
    id: 'lala-002',
    fecha: '2024-12-21',
    hora: '20:00',
    sala: 'Sala 18',
    precio: 9.00,
    asientosDisponibles: 38,
    formato: '2D'
  }
],
17: [ // Harry Potter y la Piedra Filosofal
  {
    id: 'hp-001',
    fecha: '2024-12-20',
    hora: '15:30',
    sala: 'Sala 19',
    precio: 8.50,
    asientosDisponibles: 50,
    formato: '2D'
  },
  {
    id: 'hp-002',
    fecha: '2024-12-21',
    hora: '18:45',
    sala: 'Sala 19',
    precio: 8.50,
    asientosDisponibles: 45,
    formato: '2D'
  }
],
18: [ // Zodiac
  {
    id: 'zod-001',
    fecha: '2024-12-20',
    hora: '20:15',
    sala: 'Sala 20',
    precio: 9.50,
    asientosDisponibles: 32,
    formato: '2D'
  },
  {
    id: 'zod-002',
    fecha: '2024-12-21',
    hora: '22:45',
    sala: 'Sala 20',
    precio: 9.50,
    asientosDisponibles: 28,
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
  },
  'Sala 15 - Premium': {
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  seatsPerRow: 10,
  vipRows: ['E', 'F', 'G'],
  disabledSeats: [],
  occupiedSeats: ['D5', 'D6']
},
'Sala 16 - IMAX': {
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  seatsPerRow: 12,
  vipRows: ['F', 'G', 'H'],
  disabledSeats: ['A1', 'A12', 'I1', 'I12'],
  occupiedSeats: ['E6', 'E7', 'F6', 'F7']
},
'Sala 17': {
  rows: ['A', 'B', 'C', 'D', 'E', 'F'],
  seatsPerRow: 8,
  vipRows: ['D', 'E'],
  disabledSeats: [],
  occupiedSeats: ['C3', 'C4']
},
'Sala 18': {
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  seatsPerRow: 10,
  vipRows: ['E', 'F'],
  disabledSeats: [],
  occupiedSeats: ['B5', 'B6', 'C5', 'C6']
},
'Sala 19': {
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  seatsPerRow: 12,
  vipRows: ['F', 'G'],
  disabledSeats: ['A1', 'A12'],
  occupiedSeats: ['D6', 'D7', 'E6', 'E7']
},
'Sala 20': {
  rows: ['A', 'B', 'C', 'D', 'E', 'F'],
  seatsPerRow: 8,
  vipRows: ['D', 'E'],
  disabledSeats: [],
  occupiedSeats: ['C2', 'C3', 'D2', 'D3']
}
};
  

getSeatMap(salaName: string): SeatMap {
  return this.seatMaps[salaName] || this.seatMaps['default'];
}

// Métodos para obtener próximos estrenos
getProximosEstrenos(): ProximoEstreno[] {
  // Ordenar por fecha de estreno
  return this.proximosEstrenos.sort((a, b) => {
    return new Date(a.fechaEstreno).getTime() - new Date(b.fechaEstreno).getTime();
  });
}

getProximoEstreno(id: number): ProximoEstreno | null {
  return this.proximosEstrenos.find(estreno => estreno.id === id) || null;
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
addPelicula(pelicula: Omit<Pelicula, 'idx'>): boolean {
  try {
    // Validar datos requeridos
    if (!pelicula.titulo || !pelicula.sinopsis || !pelicula.genero) {
      console.error('Faltan datos requeridos para crear la película');
      return false;
    }

    // Crear nueva película
    const nuevaPelicula: Pelicula = {
      ...pelicula,
      // Asegurar que tenga todos los campos necesarios
      trailer: pelicula.trailer || '',
      poster: pelicula.poster || 'assets/movies/default.png'
    };

    // Agregar al array
    this.peliculas.push(nuevaPelicula);
    
    // Guardar en localStorage para persistencia
    this.savePeliculasToStorage();
    
    console.log('Película agregada exitosamente:', nuevaPelicula.titulo);
    return true;
    
  } catch (error) {
    console.error('Error al agregar película:', error);
    return false;
  }
}

/**
 * Actualizar película existente (solo admin)
 */
updatePelicula(index: number, peliculaData: Partial<Pelicula>): boolean {
  try {
    // Verificar que el índice sea válido
    if (index < 0 || index >= this.peliculas.length) {
      console.error('Índice de película inválido');
      return false;
    }

    // Actualizar película
    this.peliculas[index] = {
      ...this.peliculas[index],
      ...peliculaData
    };

    // Guardar cambios
    this.savePeliculasToStorage();
    
    console.log('Película actualizada exitosamente:', this.peliculas[index].titulo);
    return true;
    
  } catch (error) {
    console.error('Error al actualizar película:', error);
    return false;
  }
}

/**
 * Eliminar película (solo admin)
 */
deletePelicula(index: number): boolean {
  try {
    // Verificar que el índice sea válido
    if (index < 0 || index >= this.peliculas.length) {
      console.error('Índice de película inválido');
      return false;
    }

    const peliculaEliminada = this.peliculas[index];
    
    // Eliminar película del array
    this.peliculas.splice(index, 1);
    
    // Eliminar funciones asociadas
    if (this.funcionesCine[index]) {
      delete this.funcionesCine[index];
    }
    
    // Reorganizar índices de funciones
    this.reorganizarIndicesFunciones(index);
    
    // Guardar cambios
    this.savePeliculasToStorage();
    this.saveFuncionesToStorage();
    
    console.log('Película eliminada exitosamente:', peliculaEliminada.titulo);
    return true;
    
  } catch (error) {
    console.error('Error al eliminar película:', error);
    return false;
  }
}

/**
 * Agregar función a una película (solo admin)
 */
addFuncionToPelicula(peliculaIndex: number, funcion: Omit<FuncionCine, 'id'>): boolean {
  try {
    // Verificar que la película existe
    if (peliculaIndex < 0 || peliculaIndex >= this.peliculas.length) {
      console.error('Índice de película inválido');
      return false;
    }

    // Generar ID único para la función
    const funcionId = this.generateFuncionId(peliculaIndex);
    
    const nuevaFuncion: FuncionCine = {
      ...funcion,
      id: funcionId
    };

    // Crear array de funciones si no existe
    if (!this.funcionesCine[peliculaIndex]) {
      this.funcionesCine[peliculaIndex] = [];
    }

    // Agregar función
    this.funcionesCine[peliculaIndex].push(nuevaFuncion);
    
    // Guardar cambios
    this.saveFuncionesToStorage();
    
    console.log('Función agregada exitosamente:', nuevaFuncion);
    return true;
    
  } catch (error) {
    console.error('Error al agregar función:', error);
    return false;
  }
}

/**
 * Eliminar función específica (solo admin)
 */
deleteFuncion(funcionId: string): boolean {
  try {
    for (const peliculaId in this.funcionesCine) {
      const funciones = this.funcionesCine[peliculaId];
      const funcionIndex = funciones.findIndex(f => f.id === funcionId);
      
      if (funcionIndex !== -1) {
        // Eliminar función
        funciones.splice(funcionIndex, 1);
        
        // Guardar cambios
        this.saveFuncionesToStorage();
        
        console.log('Función eliminada exitosamente:', funcionId);
        return true;
      }
    }
    
    console.error('Función no encontrada:', funcionId);
    return false;
    
  } catch (error) {
    console.error('Error al eliminar función:', error);
    return false;
  }
}

// ==================== MÉTODOS AUXILIARES ====================

/**
 * Generar ID único para función
 */
private generateFuncionId(peliculaIndex: number): string {
  const pelicula = this.peliculas[peliculaIndex];
  const prefix = pelicula.titulo.substring(0, 3).toLowerCase().replace(/\s/g, '');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

/**
 * Reorganizar índices de funciones después de eliminar película
 */
private reorganizarIndicesFunciones(deletedIndex: number): void {
  const nuevasFunciones: { [peliculaId: number]: FuncionCine[] } = {};
  
  for (const peliculaId in this.funcionesCine) {
    const index = parseInt(peliculaId);
    
    if (index < deletedIndex) {
      // Mantener el mismo índice
      nuevasFunciones[index] = this.funcionesCine[index];
    } else if (index > deletedIndex) {
      // Reducir índice en 1
      nuevasFunciones[index - 1] = this.funcionesCine[index];
    }
    // Si index === deletedIndex, no lo copiamos (se elimina)
  }
  
  this.funcionesCine = nuevasFunciones;
}

/**
 * Guardar películas en localStorage
 */
private savePeliculasToStorage(): void {
  try {
    localStorage.setItem('parky_peliculas', JSON.stringify(this.peliculas));
  } catch (error) {
    console.error('Error al guardar películas en localStorage:', error);
  }
}

/**
 * Guardar funciones en localStorage
 */
private saveFuncionesToStorage(): void {
  try {
    localStorage.setItem('parky_funciones', JSON.stringify(this.funcionesCine));
  } catch (error) {
    console.error('Error al guardar funciones en localStorage:', error);
  }
}

/**
 * Cargar películas desde localStorage
 */
private loadPeliculasFromStorage(): void {
  try {
    const savedPeliculas = localStorage.getItem('parky_peliculas');
    if (savedPeliculas) {
      const peliculas = JSON.parse(savedPeliculas);
      // Solo cargar si hay películas guardadas y el array actual está vacío o es el inicial
      if (peliculas.length > 0) {
        this.peliculas = peliculas;
        console.log('Películas cargadas desde localStorage:', peliculas.length);
      }
    }
  } catch (error) {
    console.error('Error al cargar películas desde localStorage:', error);
  }
}

/**
 * Cargar funciones desde localStorage
 */
private loadFuncionesFromStorage(): void {
  try {
    const savedFunciones = localStorage.getItem('parky_funciones');
    if (savedFunciones) {
      const funciones = JSON.parse(savedFunciones);
      this.funcionesCine = { ...this.funcionesCine, ...funciones };
      console.log('Funciones cargadas desde localStorage');
    }
  } catch (error) {
    console.error('Error al cargar funciones desde localStorage:', error);
  }
}

/**
 * Validar datos de película
 */
validatePeliculaData(pelicula: Partial<Pelicula>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validaciones requeridas
  if (!pelicula.titulo?.trim()) {
    errors.push('El título es requerido');
  }

  if (!pelicula.director?.trim()) {
    errors.push('El director es requerido');
  }

  if (!pelicula.sinopsis?.trim()) {
    errors.push('La sinopsis es requerida');
  }

  if (!pelicula.genero?.trim()) {
    errors.push('El género es requerido');
  }

  if (!pelicula.anio || pelicula.anio < 1900 || pelicula.anio > new Date().getFullYear() + 5) {
    errors.push('El año debe ser válido');
  }

  if (!pelicula.rating || pelicula.rating < 0 || pelicula.rating > 10) {
    errors.push('El rating debe estar entre 0 y 10');
  }

  // 🔥 CAMBIO: Validación más flexible para poster
  if (!pelicula.poster?.trim()) {
    errors.push('La URL del poster es requerida');
  } else {
    // Solo verificar que tenga contenido, no formato específico
    if (pelicula.poster.trim().length < 3) {
      errors.push('La URL del poster debe tener al menos 3 caracteres');
    }
  }

  if (!pelicula.fechaEstreno?.trim()) {
    errors.push('La fecha de estreno es requerida');
  }

  if (!pelicula.duracion?.trim()) {
    errors.push('La duración es requerida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}


  constructor() {
  console.log('Servicio de películas listo para usar!');
  
  // 🆕 CARGAR DATOS GUARDADOS AL INICIALIZAR
  this.loadPeliculasFromStorage();
  this.loadFuncionesFromStorage();
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