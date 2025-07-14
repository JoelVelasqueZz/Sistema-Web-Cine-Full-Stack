const jwt = require('jsonwebtoken');

// Clave secreta para firmar tokens (en producción usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_parkyfilms_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

class JWTUtils {
  
  // Generar token
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'parkyfilms-api',
      audience: 'parkyfilms-app'
    });
  }

  // Verificar token
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'parkyfilms-api',
        audience: 'parkyfilms-app'
      });
    } catch (error) {   
      throw new Error('Token inválido o expirado');
    }
  }

  // Decodificar token sin verificar (para debug)
  static decodeToken(token) {
    return jwt.decode(token);
  }

  // Verificar si el token está expirado
  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Obtener tiempo restante del token (en segundos)
  static getTokenTimeRemaining(token) {
    try {
      const decoded = jwt.decode(token);
      const currentTime = Date.now() / 1000;
      return Math.max(0, decoded.exp - currentTime);
    } catch (error) {
      return 0;
    }
  }

  // Refrescar token (generar uno nuevo con la misma info)
  static refreshToken(token) {
    try {
      const decoded = this.verifyToken(token);
      // Crear nuevo token con los mismos datos
      return this.generateToken({
        id: decoded.id,
        email: decoded.email,
        nombre: decoded.nombre,
        role: decoded.role
      });
    } catch (error) {
      throw new Error('No se puede refrescar un token inválido');
    }
  }
}

module.exports = JWTUtils;