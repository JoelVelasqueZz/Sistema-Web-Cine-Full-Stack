const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Verificar rutas posibles
const possiblePaths = [
  path.join(__dirname, '../dist/proyecto-cine'),
  path.join(__dirname, 'dist/proyecto-cine'),
  path.join(__dirname, '../../dist/proyecto-cine')
];

let distPath = null;

for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath + '/index.html')) {
    distPath = testPath;
    console.log(`✅ Encontrado en: ${testPath}`);
    break;
  } else {
    console.log(`❌ No encontrado en: ${testPath}`);
  }
}

if (!distPath) {
  console.error('❌ No se encontró dist/proyecto-cine/index.html en ninguna ubicación');
  process.exit(1);
}

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 ParkyFilms Frontend sirviendo en puerto ${PORT}`);
  console.log(`📁 Sirviendo desde: ${distPath}`);
});