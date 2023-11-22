import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueCronController } from './queue.cron';
import { TxModule } from 'src/tx/tx.module';
import { ConfigModule } from '@nestjs/config';
import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [TxModule, ConfigModule],
  providers: [
    QueueService,
    QueueCronController,
    makeGaugeProvider({
      name: 'rudolf_remaining_jobs',
      help: 'Total number of remaining jobs',
    }),
    makeGaugeProvider({
      name: 'rudolf_failed_jobs',
      help: 'Total number of failed jobs (retry done)',
    }),
  ],
})
export class QueueModule {}
