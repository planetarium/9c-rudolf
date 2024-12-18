import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionService } from './transaction.service';

@Injectable()
export class TransactionCronController {
  constructor(private readonly transactionService: TransactionService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleUpdateTransactionStatus() {
    await this.transactionService.updateTransactionsStatus();
  }
}
