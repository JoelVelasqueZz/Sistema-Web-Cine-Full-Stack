const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Configurar Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Google Profile:', profile);
      
      // Buscar usuario existente por OAuth
      let user = await User.findByOAuth('google', profile.id);
      
      if (user) {
        console.log('✅ Usuario Google existente encontrado:', user.email);
        return done(null, user);
      }
      
      // Buscar usuario existente por email
      const existingUser = await User.findByEmailAll(profile.emails[0].value);
      
      if (existingUser) {
        console.log('✅ Usuario existente encontrado por email:', existingUser.email);
        return done(null, existingUser);
      }
      
      // Crear nuevo usuario
      const newUser = await User.createOAuth({
        nombre: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
        provider: 'google',
        providerId: profile.id
      });
      
      console.log('✅ Nuevo usuario Google creado:', newUser.email);
      return done(null, newUser);
      
    } catch (error) {
      console.error('❌ Error en Google OAuth:', error);
      return done(error, null);
    }
  }
));

// Configurar Facebook OAuth
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails', 'photos']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Facebook Profile:', profile);
      
      // Buscar usuario existente por OAuth
      let user = await User.findByOAuth('facebook', profile.id);
      
      if (user) {
        console.log('✅ Usuario Facebook existente encontrado:', user.email);
        return done(null, user);
      }
      
      // Buscar usuario existente por email
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (email) {
        const existingUser = await User.findByEmailAll(email);
        if (existingUser) {
          console.log('✅ Usuario existente encontrado por email:', existingUser.email);
          return done(null, existingUser);
        }
      }
      
      // Crear nuevo usuario
      const newUser = await User.createOAuth({
        nombre: profile.displayName,
        email: email,
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=4267B2&color=fff&size=128`,
        provider: 'facebook',
        providerId: profile.id
      });
      
      console.log('✅ Nuevo usuario Facebook creado:', newUser.email);
      return done(null, newUser);
      
    } catch (error) {
      console.error('❌ Error en Facebook OAuth:', error);
      return done(error, null);
    }
  }
));

// Configurar GitHub OAuth
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 GitHub Profile:', profile);
      
      // Buscar usuario existente por OAuth
      let user = await User.findByOAuth('github', profile.id);
      
      if (user) {
        console.log('✅ Usuario GitHub existente encontrado:', user.email);
        return done(null, user);
      }
      
      // Buscar usuario existente por email
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (email) {
        const existingUser = await User.findByEmailAll(email);
        if (existingUser) {
          console.log('✅ Usuario existente encontrado por email:', existingUser.email);
          return done(null, existingUser);
        }
      }
      
      // Crear nuevo usuario
      const newUser = await User.createOAuth({
        nombre: profile.displayName || profile.username,
        email: email,
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=333&color=fff&size=128`,
        provider: 'github',
        providerId: profile.id
      });
      
      console.log('✅ Nuevo usuario GitHub creado:', newUser.email);
      return done(null, newUser);
      
    } catch (error) {
      console.error('❌ Error en GitHub OAuth:', error);
      return done(error, null);
    }
  }
));

// Serializar usuario para la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializar usuario desde la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;