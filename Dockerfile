FROM node:20.11.0-bullseye-slim

WORKDIR /usr/src/app
RUN chown node:node ./
USER node

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ENV APP_ENV=production
ARG APP_PORT=8415
EXPOSE $APP_PORT

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
RUN npm install -g pm2@5.3.1

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY ./ecosystem.config.json ./
COPY ./dist ./dist

CMD ["pm2-runtime", "ecosystem.config.json"]