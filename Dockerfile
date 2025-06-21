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

# Exponer puerto
EXPOSE 8080

# Iniciar aplicación desde la carpeta src
CMD ["node", "server.js"]