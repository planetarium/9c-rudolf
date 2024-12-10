FROM node:22.12.0 AS builder

WORKDIR /app

ADD . /app

RUN corepack enable
RUN yarn install --immutable

RUN yarn prisma generate

RUN yarn build

FROM node:22.12.0-slim AS runtime

WORKDIR /app

COPY --from=builder /app/dist /app
ADD .yarnrc.yml package.json yarn.lock /app/

RUN corepack enable
RUN yarn workspaces focus -A --production

CMD yarn prisma:deploy && node dist/main.js
