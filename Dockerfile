FROM node:20 AS builder

WORKDIR /app

ADD . /app

RUN yarn install

RUN yarn prisma generate

RUN yarn build

CMD yarn prisma:deploy && yarn start:prod
