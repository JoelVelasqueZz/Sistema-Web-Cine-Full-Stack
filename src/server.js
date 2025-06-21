const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos de Angular
app.use(express.static(path.join(__dirname, '../dist/proyecto-cine')));

// Todas las rutas SPA van al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/proyecto-cine/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 ParkyFilms Frontend sirviendo en puerto ${PORT}`);
});