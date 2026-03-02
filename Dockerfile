FROM node:20-slim

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código
COPY . .

# Exponer puerto (Cloud Run usa variable PORT)
EXPOSE 8080

# Comando de inicio
CMD ["node", "server.js"]
