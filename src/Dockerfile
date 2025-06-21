FROM node:18-alpine

WORKDIR /app

# Copiar todo
COPY . .

# Ir a src/
WORKDIR /app/src

# Instalar y compilar
RUN npm install
RUN npm run build

# Ejecutar desde src/
CMD ["npm", "start"]