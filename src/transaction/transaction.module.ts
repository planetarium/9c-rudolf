import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionCronController } from './transaction.cron';
import { TxModule } from 'src/tx/tx.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [TxModule, PrismaModule],
  providers: [TransactionService, TransactionCronController],
  controllers: [TransactionController],
})
export class TransactionModule {}
