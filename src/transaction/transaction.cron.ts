import { Injectable } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TransactionCronController {
  constructor(private readonly transactionService: TransactionService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleUpdateTransactionStatus() {
    await this.transactionService.updateTransactionsStatus();
  }
}
