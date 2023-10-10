import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { TxModule } from 'src/tx/tx.module';

@Module({
  imports: [TxModule],
  providers: [QueueService, QueueController],
})
export class QueueModule {}
