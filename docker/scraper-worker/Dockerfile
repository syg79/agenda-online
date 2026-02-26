FROM node:20-slim
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY worker.js .
EXPOSE 3034
CMD ["node", "worker.js"]
