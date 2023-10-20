import { Module } from '@nestjs/common';
import { TxService } from './tx.service';
import { ConfigModule } from '@nestjs/config';
import { ActionService } from './action.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      headers: { 'Content-Type': 'application/json' },
    }),
  ],
  providers: [TxService, ActionService],
  exports: [TxService],
})
export class TxModule {}
