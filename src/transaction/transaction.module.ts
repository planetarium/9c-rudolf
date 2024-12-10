import { Module } from '@nestjs/common';
import { TxModule } from 'src/tx/tx.module';
import { TransactionController } from './transaction.controller';
import { TransactionCronController } from './transaction.cron';
import { TransactionService } from './transaction.service';

@Module({
  imports: [TxModule],
  providers: [TransactionService, TransactionCronController],
  controllers: [TransactionController],
})
export class TransactionModule {}
