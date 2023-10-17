import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getJobStatus } from 'src/job/job-status.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
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
}
