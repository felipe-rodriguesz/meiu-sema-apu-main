# Stage 1: Build
FROM docker.io/library/node:18-alpine AS build

WORKDIR /app

# Instala dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copia o código e gera o build
COPY . .
RUN npm run build

# Stage 2: Production Dependencies
# Instala apenas as dependências de produção para manter a imagem leve
FROM docker.io/library/node:18-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Stage 3: Runtime
FROM docker.io/library/node:18-alpine

WORKDIR /app

# Copia apenas o necessário do estágio de build e de dependências de produção
COPY --from=build /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

EXPOSE 3001

# OWASP: Não rodar como root por segurança (opcional mas recomendado)
# USER node

CMD ["node", "dist/main"]
