// src/controllers/auth/passwordResetController.js
const User = require('../../models/User');
const PasswordReset = require('../../models/PasswordReset');
const nodemailer = require('nodemailer');

// Configuración del transporter de email (usa tu configuración)
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail', // o tu servicio de email
        auth: {
            user: process.env.EMAIL_USER || 'parkyfilms@gmail.com',
            pass: process.env.EMAIL_PASSWORD || 'tu_app_password'
        }
    }); 
};

/**
 * Solicitar recuperación de contraseña
 */
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        // Validaciones básicas
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'El email es obligatorio'
            });
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de email inválido'
            });
        }

        // Obtener IP y User Agent para seguridad
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        try {
            // Crear token de recuperación
            const tokenData = await PasswordReset.createToken(
                email.toLowerCase(), 
                ipAddress, 
                userAgent
            );

            // Crear el enlace de recuperación
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password/${tokenData.token}`;

            // Configurar el email
            const transporter = createEmailTransporter();
            
            const mailOptions = {
                from: `"Parky Films" <${process.env.EMAIL_USER || 'parkyfilms@gmail.com'}>`,
                to: email,
                subject: '🔐 Recuperación de Contraseña - Parky Films',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">🎬 Parky Films</h1>
                            <p style="color: white; margin: 10px 0 0 0;">Recuperación de Contraseña</p>
                        </div>
                        
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333; margin-bottom: 20px;">¡Hola!</h2>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                                Recibimos una solicitud para restablecer la contraseña de tu cuenta en Parky Films.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" 
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          padding: 15px 30px; 
                                          text-decoration: none; 
                                          border-radius: 25px; 
                                          font-weight: bold;
                                          display: inline-block;">
                                    🔐 Restablecer Contraseña
                                </a>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; font-size: 14px;">
                                <strong>⏰ Este enlace expira en 1 hora</strong><br>
                                Si no solicitaste este cambio, puedes ignorar este email de forma segura.
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            
                            <p style="color: #999; font-size: 12px; text-align: center;">
                                Si tienes problemas con el botón, copia y pega este enlace en tu navegador:<br>
                                <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
                            </p>
                        </div>
                        
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #ccc; margin: 0; font-size: 12px;">
                                © ${new Date().getFullYear()} Parky Films. Todos los derechos reservados.
                            </p>
                        </div>
                    </div>
                `
            };

            // Enviar email
            await transporter.sendMail(mailOptions);

            res.json({
                success: true,
                message: 'Se ha enviado un enlace de recuperación a tu email'
            });

        } catch (error) {
            if (error.message === 'Usuario no encontrado') {
                // Por seguridad, no revelamos si el email existe o no
                res.json({
                    success: true,
                    message: 'Si el email está registrado, recibirás un enlace de recuperación'
                });
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('Error en solicitud de recuperación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

/**
 * Validar token de recuperación
 */
const validateResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token requerido'
            });
        }

        const tokenData = await PasswordReset.validateToken(token);

        if (!tokenData) {
            return res.status(400).json({
                success: false,
                error: 'Token inválido o expirado'
            });
        }

        res.json({
            success: true,
            message: 'Token válido',
            data: {
                email: tokenData.email,
                nombre: tokenData.nombre
            }
        });

    } catch (error) {
        console.error('Error validando token:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

/**
 * Restablecer contraseña
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        // Validaciones básicas
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son obligatorios'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Las contraseñas no coinciden'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Validar token
        const tokenData = await PasswordReset.validateToken(token);

        if (!tokenData) {
            return res.status(400).json({
                success: false,
                error: 'Token inválido o expirado'
            });
        }

        // Obtener IP para auditoría
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Actualizar contraseña del usuario
        await User.updatePassword(tokenData.usuario_id, newPassword);

        // Marcar token como usado
        await PasswordReset.markTokenAsUsed(token, ipAddress);

        res.json({
            success: true,
            message: 'Contraseña restablecida exitosamente'
        });

    } catch (error) {
        console.error('Error restableciendo contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

module.exports = {
    requestPasswordReset,
    validateResetToken,
    resetPassword
};