FROM node:18-alpine

WORKDIR /app

# Copiar todo
COPY . .

# Ir a src/
WORKDIR /app/src

# Instalar y compilar
RUN npm install
RUN npm run build

# Ver qué archivos se generaron (DEBUG)
RUN ls -la 
RUN ls -la dist/ || echo "No existe dist/"
RUN ls -la dist/proyecto-cine/ || echo "No existe dist/proyecto-cine/"

# Ejecutar desde src/
CMD ["npm", "start"]