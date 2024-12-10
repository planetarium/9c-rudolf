import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActionService } from './action.service';
import { TxService } from './tx.service';

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
