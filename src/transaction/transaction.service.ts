import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { getJobStatus } from 'src/job/job-status.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { getTxResult } from 'src/tx/tx.entity';

const UPDATE_TRANSACTIONS_SIZE = 10;

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async getTransaction(id: string) {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
      include: {
        executions: { include: { job: true } },
      },
    });

    const jobs = transaction.executions.map((execution) => execution.job);
    if (jobs.length === 0) {
      throw new InternalServerErrorException(
        'Transaction not contains any job',
      );
    }

    const status = await getJobStatus(jobs[0], id);

    return { id, status, jobs };
  }

  async updateTransactionsStatus() {
    const transactions = await this.prismaService.transaction.findMany({
      where: {
        OR: [
          { lastStatus: { notIn: ['SUCCESS', 'FAILURE'] } },
          { lastStatus: null },
        ],
      },
      orderBy: {
        statusUpdatedAt: 'asc',
      },
      take: UPDATE_TRANSACTIONS_SIZE,
    });

    if (transactions.length === 0) {
      this.logger.log(
        '[updateTransactionsStatus] There is no tx to update. :D',
      );
      return;
    }

    const results = await Promise.all(
      transactions.map(async (transaction) => getTxResult(transaction.id)),
    );
    this.logger.debug('[updateTransactionsStatus] Updated txs', results);

    await this.prismaService.$transaction(
      transactions.map((transaction, index) =>
        this.prismaService.transaction.update({
          where: { id: transaction.id },
          data: {
            lastStatus: results[index],
            statusUpdatedAt: new Date(),
          },
        }),
      ),
    );
  }
}
