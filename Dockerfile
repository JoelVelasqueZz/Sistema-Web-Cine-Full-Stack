FROM node:18-alpine

WORKDIR /app

# Copiar todo el código fuente
COPY . .

# Ir a la carpeta src y instalar dependencias
WORKDIR /app/src

# Instalar dependencias
RUN npm install

# Compilar Angular (esto crea /app/dist/proyecto-cine/browser)
RUN npm run build

# Verificar que los archivos existen en la ubicación correcta
RUN ls -la /app/dist/proyecto-cine/browser/ || echo "ERROR: No se encontraron archivos compilados en browser/"

# Exponer puerto
EXPOSE 8080

# Iniciar aplicación desde la carpeta src
CMD ["node", "server.js"]