FROM node:22.12.0 AS builder

WORKDIR /app

ADD . /app

RUN yarn install --immutable

RUN yarn prisma generate

RUN yarn build

CMD yarn prisma:deploy && yarn start:prod
