import { Module } from '@nestjs/common';
import { TxService } from './tx.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [TxService],
  exports: [TxService],
})
export class TxModule {}
