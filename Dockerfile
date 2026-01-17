# Estágio 1: Build do Frontend (React + Vite)
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Execução do Servidor (Node.js + Express)
FROM node:20-slim
WORKDIR /app

# Variáveis de ambiente para produção
ENV NODE_ENV=production

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm install --production

# Copia os arquivos estáticos gerados pelo Vite (dist)
COPY --from=build /app/dist ./dist

# Copia o servidor backend e outros arquivos necessários
COPY server.js ./
COPY types.ts ./

# Expõe a porta que o servidor usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]
