import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClaimItemsDto } from './dto/create-claim-items.dto';
import { CreateTransferAssetsDto } from './dto/create-transfer-assets.dto';
import { getCurrency } from 'src/utils/currency';
import { JobStatus, getJobStatusFromTxResult } from './job-status.entity';
import { TxService } from 'src/tx/tx.service';
import { Job, TxResult } from '@prisma/client';
import { CreateClaimItemsEventDto } from './dto/create-claim-items-event.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly txService: TxService,
  ) {}

  async getJob(id: string) {
    const job = await this.prismaService.job.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { transaction: true },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    const execution = job.executions[0] ?? null;
    const transactionId = execution?.transactionId ?? null;
    const currency = getCurrency(job.ticker);
    const lastTxStatus = execution?.transaction?.lastStatus;
    const status = await this.getJobStatus(job, transactionId, lastTxStatus);

    const jobSequence = await this.prismaService.job.count({
      where: { createdAt: { lt: job.createdAt }, processedAt: null },
    });

    return {
      ...job,
      retries: execution?.retries ?? 0,
      transactionId,
      status,
      currency,
      jobSequence,
    };
  }

  async createJobsByEvent(dto: CreateClaimItemsEventDto) {
    const targetTickers = dto.items.map((item) => item.ticker);
    const whitelist = await this.prismaService.tickerWhitelist.findMany({
      where: { ticker: { in: targetTickers } },
    });
    if (whitelist.length !== targetTickers.length)
      throw new BadRequestException('Ticker not whitelisted');

    return await this.prismaService.$transaction(async (tx) => {
      const isExisting = await tx.job.findFirst({
        where: { eventId: dto.eventId },
      });
      if (isExisting) throw new BadRequestException('Event already exists');

      return await tx.job.createMany({
        data: dto.items.map((item) => ({
          id: randomUUID(),
          eventId: dto.eventId,
          actionType: 'CLAIM_ITEMS',
          address: item.avatarAddress,
          ticker: item.ticker,
          amount: item.amount,
        })),
      });
    });
  }

  async createClaimItems(dto: CreateClaimItemsDto) {
    const whitelist = await this.prismaService.tickerWhitelist.findUnique({
      where: { ticker: dto.item.ticker },
    });
    if (!whitelist) throw new BadRequestException('Ticker not whitelisted');

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

      const jobSequence = await tx.job.count({
        where: { createdAt: { lt: job.createdAt }, processedAt: null },
      });

      return { ...job, jobSequence: jobSequence + 1 };
    });
  }

  async createTransferAssets(dto: CreateTransferAssetsDto) {
    const whitelist = await this.prismaService.tickerWhitelist.findUnique({
      where: { ticker: dto.item.ticker },
    });
    if (!whitelist) throw new BadRequestException('Ticker not whitelisted');

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

  async getJobStatus(job: Job, transactionId: string, lastTxStatus?: TxResult) {
    if (lastTxStatus === 'SUCCESS') return JobStatus.SUCCESS;
    if (lastTxStatus === 'FAILURE') return JobStatus.FAILED;

    if (job.startedAt === null) return JobStatus.PENDING;
    if (job.processedAt === null) return JobStatus.PROCESSING;

    try {
      const txResult = await this.txService.getTxResult(transactionId);

      return getJobStatusFromTxResult(txResult);
    } catch (error) {
      this.logger.error('Failed to get tx result from gql.', error);

      if (lastTxStatus) return getJobStatusFromTxResult(lastTxStatus);

      return JobStatus.PROCESSING;
    }
  }
}
