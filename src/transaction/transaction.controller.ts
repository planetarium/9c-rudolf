import { Controller, Get, Param } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleUpdateTransactionStatus() {
    await this.transactionService.updateTransactionsStatus();
  }

  @Get(':id')
  async getTransaction(@Param('id') id: string) {
    const transaction = await this.transactionService.getTransaction(id);

    return {
      actionType: transaction.jobs[0].actionType,
      id: transaction.id,
      status: transaction.status,
      jobIds: transaction.jobs.map((job) => job.id),
    };
  }
}
