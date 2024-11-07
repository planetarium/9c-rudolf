import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JobModule } from './job/job.module';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from './queue/queue.module';
import { TransactionModule } from './transaction/transaction.module';
import { ConfigModule } from '@nestjs/config';
import { TxModule } from './tx/tx.module';
import { CacheModule } from '@nestjs/cache-manager';
import {
  PrometheusModule,
  makeCounterProvider,
} from '@willsoto/nestjs-prometheus';
import { HttpResponseMiddleware } from './http-response.middleware';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    CacheModule.register({ isGlobal: true }),
    PrometheusModule.register(),

    PrismaModule,
    JobModule,
    TransactionModule,
    QueueModule,
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
