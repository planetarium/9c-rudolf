import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionCronController } from './transaction.cron';

@Module({
  providers: [TransactionService, TransactionCronController],
  controllers: [TransactionController],
})
export class TransactionModule {}
