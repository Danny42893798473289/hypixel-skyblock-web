FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm install
RUN npm run build
ENV PORT=3001
EXPOSE 3001
CMD ["npm", "start"]
