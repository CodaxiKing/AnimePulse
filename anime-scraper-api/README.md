# Anime Scraper API

Uma API de web scraping para sites de anime que permite buscar animes e episódios de múltiplos sites de streaming.

## Sites Suportados

- **AnimesDigital.org** - Grande variedade de animes
- **AnimesOnlineCC.to** - Coleção extensa de animes legendados e dublados  
- **Goyabu.to** - Animes populares com episódios atualizados

## Instalação

```bash
cd anime-scraper-api
npm install
```

## Como Usar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

A API estará disponível em `http://localhost:3001`

## Endpoints da API

### 1. Buscar Animes
```
GET /api/animes?q=<query>&site=<siteId>
```

**Parâmetros:**
- `q` (opcional): Termo de busca
- `site` (opcional): ID do site específico (animesdigital, animesonlinecc, goyabu)

**Exemplo:**
```bash
curl "http://localhost:3001/api/animes?q=naruto"
```

### 2. Obter Episódios de um Anime
```
GET /api/animes/:siteId/:animeId/episodes?animeUrl=<url>
```

**Parâmetros:**
- `siteId`: ID do site
- `animeId`: ID do anime
- `animeUrl`: URL completa do anime no site

**Exemplo:**
```bash
curl "http://localhost:3001/api/animes/animesdigital/123/episodes?animeUrl=https://animesdigital.org/anime/naruto"
```

### 3. Obter URL de Streaming de um Episódio
```
GET /api/episodes/:siteId/:episodeId/stream?episodeUrl=<url>
```

**Parâmetros:**
- `siteId`: ID do site
- `episodeId`: ID do episódio
- `episodeUrl`: URL completa do episódio

**Exemplo:**
```bash
curl "http://localhost:3001/api/episodes/animesdigital/123-ep-1/stream?episodeUrl=https://animesdigital.org/episode/naruto-1"
```

## Resposta da API

Todas as respostas seguem o formato:

```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

A API possui rate limiting de 10 requisições por minuto por IP.

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3001)

## Deploy

### Heroku
```bash
git init
git add .
git commit -m "Initial commit"
heroku create your-anime-scraper-api
git push heroku main
```

### Railway
```bash
railway login
railway init
railway up
```

### Vercel
```bash
vercel --prod
```

### VPS (Servidor Próprio)

#### Opção 1: Com Docker (Recomendado)
```bash
# 1. Copie a pasta anime-scraper-api para sua VPS
# 2. Execute:
docker-compose up -d

# Ver logs:
docker-compose logs -f

# Parar:
docker-compose down
```

#### Opção 2: Instalação Direta
```bash
# 1. Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar dependências
npm install

# 3. Instalar Playwright
npx playwright install
npx playwright install-deps

# 4. Usar PM2 para manter rodando
sudo npm install -g pm2
pm2 start index.js --name "anime-scraper"
pm2 startup
pm2 save
```

#### Configurar no Frontend
No seu projeto React, atualize a URL da API:
```env
# .env
VITE_SCRAPING_API_URL=http://sua-vps-ip:3001
```

## Uso com CORS

A API já possui CORS habilitado para aceitar requisições de qualquer origem. Para produção, configure as origens permitidas.

## Estrutura de Dados

### Anime
```json
{
  "id": "string",
  "siteId": "string",
  "title": "string",
  "url": "string",
  "thumbnail": "string",
  "totalEpisodes": "number",
  "genres": ["string"],
  "status": "string",
  "year": "number"
}
```

### Episódio
```json
{
  "id": "string",
  "animeId": "string", 
  "siteId": "string",
  "number": "number",
  "title": "string",
  "url": "string",
  "thumbnail": "string",
  "duration": "string",
  "releaseDate": "string"
}
```

### Streaming
```json
{
  "streamingUrl": "string",
  "referer": "string",
  "headers": {
    "Referer": "string",
    "User-Agent": "string"
  }
}
```