const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;

// Ver TODO el sistema de archivos
console.log('=== BÚSQUEDA COMPLETA ===');
try {
  const findResult = execSync('find /app -name "index.html" -type f', { encoding: 'utf8' });
  console.log('Archivos index.html encontrados:');
  console.log(findResult);
} catch (e) {
  console.log('Error en find:', e.message);
}

// Buscar archivos .js también
try {
  const jsFiles = execSync('find /app -name "*.js" -path "*/dist/*" -type f', { encoding: 'utf8' });
  console.log('Archivos JS en dist:');
  console.log(jsFiles);
} catch (e) {
  console.log('Error buscando JS:', e.message);
}

// Mostrar estructura completa
try {
  const structure = execSync('ls -la /app/', { encoding: 'utf8' });
  console.log('Estructura /app/:');
  console.log(structure);
} catch (e) {
  console.log('Error listando:', e.message);
}

// Mostrar estructura de src
try {
  const srcStructure = execSync('ls -la /app/src/', { encoding: 'utf8' });
  console.log('Estructura /app/src/:');
  console.log(srcStructure);
} catch (e) {
  console.log('Error listando src:', e.message);
}

// Página simple para confirmar que funciona
app.get('*', (req, res) => {
  res.send(`
    <html>
      <head><title>ParkyFilms - Debug</title></head>
      <body>
        <h1>🎬 ParkyFilms Frontend</h1>
        <p>El servidor está funcionando pero no encuentra los archivos compilados.</p>
        <p>Revisa los logs para ver la estructura de archivos.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 ParkyFilms Frontend sirviendo en puerto ${PORT}`);
});