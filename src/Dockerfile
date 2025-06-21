FROM node:18-alpine

# Crear carpeta de trabajo
WORKDIR /app

# Copiar todo el proyecto
COPY . .

# Instalar dependencias desde raíz (donde está package.json)
RUN npm install

# Compilar Angular (si está definido en tu package.json)
RUN npm run build

# Exponer puerto que usa tu servidor (ajústalo si usas otro)
EXPOSE 8080

# Ejecutar servidor correctamente desde src
CMD ["node", "src/server.js"]
