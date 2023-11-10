import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueCronController } from './queue.cron';
import { TxModule } from 'src/tx/tx.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TxModule, ConfigModule],
  providers: [QueueService, QueueCronController],
})
export class QueueModule {}
