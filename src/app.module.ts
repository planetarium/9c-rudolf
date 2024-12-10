import { CacheModule } from '@nestjs/cache-manager';
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  PrometheusModule,
  makeCounterProvider,
} from '@willsoto/nestjs-prometheus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpResponseMiddleware } from './http-response.middleware';
import { JobModule } from './job/job.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { TransactionModule } from './transaction/transaction.module';
import { TxModule } from './tx/tx.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    JobModule,
    TransactionModule,
    QueueModule,
    ConfigModule.forRoot(),
    CacheModule.register({ isGlobal: true }),
    PrometheusModule.register(),
    TxModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    makeCounterProvider({
      name: 'node_http_request_count_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'url'],
    }),
    makeCounterProvider({
      name: 'node_http_response_count_total',
      help: 'Total number of HTTP responses',
      labelNames: ['method', 'status_code', 'url'],
    }),
    HttpResponseMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpResponseMiddleware).forRoutes('*');
  }
}
