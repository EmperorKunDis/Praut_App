FROM node:18-alpine

WORKDIR /usr/src/app

# Install build dependencies for argon2
RUN apk add --no-cache make gcc g++ python3

COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm rebuild argon2 --build-from-source

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]