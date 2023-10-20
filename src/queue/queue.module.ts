import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueCronController } from './queue.cron';
import { TxModule } from 'src/tx/tx.module';

@Module({
  imports: [TxModule],
  providers: [QueueService, QueueCronController],
})
export class QueueModule {}
