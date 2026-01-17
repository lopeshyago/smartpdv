# ESTÁGIO 1: Build do Frontend (React + Vite)
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copia arquivos de configuração de pacotes
COPY package*.json ./

# Instala todas as dependências (incluindo as de desenvolvimento para o build)
RUN npm install

# Copia o restante do código do projeto
COPY . .

# Executa o build do Vite (gera a pasta /dist)
RUN npm run build

# ESTÁGIO 2: Runtime (Servidor Node.js + Express)
FROM node:20-alpine AS runtime-stage

WORKDIR /app

# Copia apenas os arquivos necessários para o servidor rodar
COPY package*.json ./
RUN npm install --production

# Copia o servidor Express
COPY server.js ./

# Copia a pasta 'dist' gerada no estágio anterior
COPY --from=build-stage /app/dist ./dist

# Expõe a porta 3000 (configurada no seu server.js)
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
