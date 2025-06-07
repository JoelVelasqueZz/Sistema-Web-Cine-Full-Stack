const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyToken,
  refreshToken,
  logout,
  changePassword
} = require('../controllers/auth/authController');

const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', login);

// POST /api/auth/refresh - Refrescar token
router.post('/refresh', refreshToken);

// Rutas protegidas (requieren autenticación)

// GET /api/auth/verify - Verificar token y obtener info del usuario
router.get('/verify', authenticateToken, verifyToken);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, logout);

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', authenticateToken, changePassword);

module.exports = router;