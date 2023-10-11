import { Module } from '@nestjs/common';
import { TxService } from './tx.service';
import { ConfigModule } from '@nestjs/config';
import { ActionService } from './action.service';

@Module({
  imports: [ConfigModule],
  providers: [TxService, ActionService],
  exports: [TxService],
})
export class TxModule {}
