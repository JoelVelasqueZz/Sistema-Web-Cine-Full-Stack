// Configuración de CORS para permitir peticiones desde el frontend

const corsConfig = {
  origin: function (origin, callback) {
    // Lista de dominios permitidos
    const allowedOrigins = [
      process.env.CORS_ORIGIN, // http://localhost:4200 (Angular)
      'http://localhost:3000', // Por si quieres probar desde otro puerto
      'http://127.0.0.1:4200', 
      'http://127.0.0.1:3000'
    ];

    // En desarrollo, permitir requests sin origin (ej: Postman, curl)
    if (process.env.NODE_ENV === 'development' && !origin) {
      return callback(null, true);
    }

    // Verificar si el origin está en la lista permitida
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin no permitido:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },

  // Métodos HTTP permitidos
  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS'
  ],

  // Headers permitidos
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],

  // Headers expuestos al cliente
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count'
  ],

  // Permitir cookies cross-origin
  credentials: true,

  // Tiempo de cache para preflight requests (en segundos)
  maxAge: 86400, // 24 horas

  // Responder a OPTIONS requests
  optionsSuccessStatus: 200
};

module.exports = {
  corsConfig
};