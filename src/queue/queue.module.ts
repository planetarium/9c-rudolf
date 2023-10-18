import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { TxModule } from 'src/tx/tx.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [TxModule, CacheModule.register()],
  providers: [QueueService, QueueController],
})
export class QueueModule {}
