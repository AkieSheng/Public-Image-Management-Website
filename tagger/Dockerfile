FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm i --no-audit --no-fund; \
    fi

COPY . .
EXPOSE 8080
CMD ["node","index.js"]
