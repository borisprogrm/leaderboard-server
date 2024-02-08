FROM node:20.11.0-bullseye-slim

WORKDIR /usr/src/app
RUN chown node:node ./
USER node

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ENV APP_ENV=production
ARG APP_PORT=8415
EXPOSE $APP_PORT

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY ./dist ./dist

CMD ["node", "./dist/app.js"]