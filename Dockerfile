FROM node:20 AS builder

WORKDIR /app

ADD . /app

RUN yarn install

RUN yarn prisma generate

RUN yarn build

FROM node:20-alpine

COPY --from=builder /app /app

ENTRYPOINT [ "yarn", "start:prod" ]
