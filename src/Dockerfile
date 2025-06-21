FROM node:18-alpine

WORKDIR /app

# Copiar todo
COPY . .

# Ir a src/
WORKDIR /app/src

# Instalar dependencias
RUN npm install

# Compilar Angular con debug
RUN echo "=== Iniciando build ===" 
RUN npm run build || echo "Build falló"
RUN echo "=== Build terminado ==="

# Ver estructura completa
RUN echo "=== Contenido de /app/src ==="
RUN ls -la 
RUN echo "=== Buscando dist ==="
RUN find . -name "dist" -type d || echo "No encontró carpeta dist"
RUN echo "=== Buscando archivos .html ==="
RUN find . -name "*.html" || echo "No encontró archivos HTML"

# Ejecutar desde src/
CMD ["npm", "start"]