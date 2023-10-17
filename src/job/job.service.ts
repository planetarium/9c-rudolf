import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClaimItemsDto } from './dto/create-claim-items.dto';
import { CreateTransferAssetsDto } from './dto/create-transfer-assets.dto';
import { getCurrency } from 'src/utils/currency';
import { getJobStatus } from './job-status.entity';

@Injectable()
export class JobService {
  constructor(private readonly prismaService: PrismaService) {}

  async getJob(id: string) {
    const job = await this.prismaService.job.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    const execution = job.executions[0] ?? null;
    const transactionId = execution?.transactionId ?? null;
    const currency = getCurrency(job.ticker);
    const status = await getJobStatus(job, transactionId);

    return {
      ...job,
      retries: execution?.retries ?? 0,
      transactionId,
      status,
      currency,
    };
  }

  async createClaimItems(dto: CreateClaimItemsDto) {
    return await this.prismaService.$transaction(async (tx) => {
      const isExisting = await tx.job.findUnique({
        where: { id: dto.id },
      });
      if (isExisting) throw new BadRequestException('Job already exists');

      const job = await tx.job.create({
        data: {
          id: dto.id,
          actionType: 'CLAIM_ITEMS',
          address: dto.avatarAddress,
          ticker: dto.item.ticker,
          amount: dto.item.amount,
        },
      });

      const jobSequence = await this.prismaService.job.count({
        where: { createdAt: { lt: job.createdAt }, processedAt: null },
      });

      return { ...job, jobSequence: jobSequence + 1 };
    });
  }

  async createTransferAssets(dto: CreateTransferAssetsDto) {
    return await this.prismaService.$transaction(async (tx) => {
      const isExisting = await tx.job.findUnique({
        where: { id: dto.id },
      });
      if (isExisting) throw new BadRequestException('Job already exists');

      const address = dto.avatarAddress ?? dto.agentAddress;
      const job = await tx.job.create({
        data: {
          id: dto.id,
          actionType: 'TRANSFER_ASSETS',
          address,
          ticker: dto.item.ticker,
          amount: dto.item.amount,
        },
      });

      const jobSequence = await tx.job.count({
        where: { createdAt: { lt: job.createdAt }, processedAt: null },
      });

      return { ...job, jobSequence: jobSequence + 1 };
    });
  }
}
