import { Injectable } from '@nestjs/common';
import { getJobStatus } from 'src/job/job-status.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private readonly prismaService: PrismaService) {}

  async getTransaction(id: string) {
    const jobs = await this.prismaService.job.findMany({
      where: { transactionId: id },
    });
    const status = await getJobStatus(jobs[0]);

    return { id, status, jobs };
  }
}
