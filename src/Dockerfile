FROM node:18-alpine

WORKDIR /app

# Copiar todo
COPY . .

# Ir a src/
WORKDIR /app/src

# Instalar dependencias
RUN npm install

# Compilar Angular
RUN npm run build

# Copiar archivos compilados a src/dist
RUN cp -r ../dist ./ || echo "Copiando dist a src/"

# Ver estructura final
RUN ls -la dist/

# Ejecutar desde src/
CMD ["npm", "start"]