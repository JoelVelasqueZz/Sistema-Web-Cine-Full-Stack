FROM node:18-alpine

WORKDIR /app

# Copiar todo el código fuente
COPY . .

# Ir a la carpeta src y instalar dependencias
WORKDIR /app/src

# Instalar dependencias
RUN npm install

# Compilar Angular
RUN npm run build

# Volver a la raíz donde está server.js
WORKDIR /app

# Exponer puerto
EXPOSE 8080

# Iniciar aplicación desde la raíz (donde está server.js)
CMD ["node", "server.js"]