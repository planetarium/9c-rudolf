import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JobModule } from './job/job.module';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from './queue/queue.module';
import { TransactionModule } from './transaction/transaction.module';
import { ConfigModule } from '@nestjs/config';
import { TxModule } from './tx/tx.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), JobModule, TransactionModule, QueueModule, ConfigModule.forRoot(), TxModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
