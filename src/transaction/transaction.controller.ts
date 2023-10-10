import { Controller, Get, Param } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

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
