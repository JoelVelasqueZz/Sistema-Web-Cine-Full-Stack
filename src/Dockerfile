FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Compilar Angular
RUN npm run build

# Exponer puerto
EXPOSE 8080

# Iniciar aplicación
CMD ["npm", "start"]