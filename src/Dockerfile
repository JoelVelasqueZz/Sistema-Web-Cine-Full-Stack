FROM node:18-alpine

WORKDIR /app

# Copiar todo
COPY . .

# Ir a src/
WORKDIR /app/src

# Instalar dependencias
RUN npm install

# Compilar Angular (esto crea /app/dist/proyecto-cine)
RUN npm run build

# Ver qué se creó exactamente
RUN echo "=== Verificando estructura después del build ==="
RUN ls -la /app/
RUN ls -la /app/dist/ || echo "No existe /app/dist/"
RUN ls -la /app/dist/proyecto-cine/ || echo "No existe /app/dist/proyecto-cine/"

# Ejecutar desde src/
CMD ["npm", "start"]