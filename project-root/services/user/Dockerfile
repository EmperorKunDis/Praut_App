FROM node:18-alpine

WORKDIR /usr/src/app

# Install build dependencies for bcrypt
RUN apk add --no-cache make gcc g++ python3

COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm rebuild bcrypt --build-from-source

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
