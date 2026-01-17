# Estágio 1: Build do Frontend
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Execução do Servidor
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
# Copia o build do frontend do estágio anterior
COPY --from=build /app/dist ./dist
# Copia o servidor backend
COPY server.js ./
# Copia os tipos para o node processar se necessário (opcional para o server.js)
COPY types.ts ./

EXPOSE 3000
CMD ["npm", "start"]
