import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActionType, Job, Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { TxService } from 'src/tx/tx.service';

const DEFAULT_TX_ACTIONS_SIZE = 100;
const JOT_RETRY_LIMIT = 1;

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly DEFAULT_START_NONCE: bigint;
  private readonly TX_ACTIONS_SIZE: number;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly txService: TxService,
    private readonly configService: ConfigService,
  ) {
    this.DEFAULT_START_NONCE = BigInt(
      configService.get('DEFAULT_START_NONCE') ?? 0n,
    );
    this.TX_ACTIONS_SIZE = Number(
      configService.get('TX_ACTIONS_SIZE') ?? DEFAULT_TX_ACTIONS_SIZE,
    );
  }

  async handleCron() {
    await this.processJob(ActionType.CLAIM_ITEMS);
    await this.processJob(ActionType.TRANSFER_ASSETS);
  }

  async handleStagingCron() {
    const nextTxNonce = await this.txService.getNextNonceFromRemote();
    const tx = await this.prismaService.transaction.findUnique({
      where: {
        nonce: nextTxNonce,
      },
      select: {
        id: true,
        raw: true,
      },
    });

    if (tx === null) {
      this.logger.log('[stageTx] There is no tx to stage. :D');
      return;
    }

    const { raw, id } = tx;
    this.logger.debug('[stageTx] Try to stage tx', id);
    await this.txService.stageTx(raw.toString('hex'));
    this.logger.debug('[stageTx] Staged tx', id);
  }

  async getJobCounts() {
    const jobs = await this.prismaService.job.count();
    const pendingJobs = await this.prismaService.job.count({
      where: { processedAt: null },
    });
    const failedJobs = await this.prismaService.job.count({
      where: {
        executions: {
          some: { retries: 5, transaction: { lastStatus: 'FAILURE' } },
        },
      },
    });

    return { jobs, pendingJobs, failedJobs };
  }

  private async processJob(actionType: ActionType) {
    await this.prismaService.$transaction(async (prisma) => {
      this.logger.debug(`[Job::${actionType}] started`);

      // Collect jobs
      type JobWithRetries = Job & { retries: number };
      const jobs = await prisma.$queryRaw<JobWithRetries[]>(Prisma.sql`
        SELECT j.*, je."retries" retries FROM "Job" j
        LEFT JOIN "JobExecution" je ON (
          je."jobId" = j."id"
          AND NOT EXISTS (
            SELECT 1 FROM "JobExecution" je1
            WHERE je1."jobId" = j."id"
            AND je1."retries" > je."retries"
          )
        )
        LEFT JOIN "Transaction" t ON t."id" = je."transactionId"
        WHERE j."actionType" = ${actionType}::"ActionType"
          AND (t."id" IS NULL OR t."lastStatus" = 'FAILURE')
          AND (je."retries" IS NULL OR je."retries" < ${JOT_RETRY_LIMIT})
        ORDER BY j."processedAt" IS NULL DESC, j."processedAt" ASC
        LIMIT ${this.TX_ACTIONS_SIZE};
      `);

      if (jobs.length === 0) {
        this.logger.log(
          `[Job::${actionType}] There is no jobs to create tx. :D`,
        );
        return;
      }

      const jobIds = jobs.map((job) => job.id);
      this.logger.debug(`[Job::${actionType}] ${jobs.length} jobs found`);

      await prisma.job.updateMany({
        data: { startedAt: new Date() },
        where: { id: { in: jobIds } },
      });

      this.logger.debug(`[Job::${actionType}] Mark as started.`);

      // Get next nonce
      const lastTx = await prisma.transaction.findFirst({
        orderBy: { nonce: 'desc' },
        select: { nonce: true },
      });
      const nextNonce = bigintMathMax(
        lastTx ? lastTx.nonce + 1n : 0n,
        this.DEFAULT_START_NONCE,
      );

      // Create tx
      const { id, body, raw } = await this.txService.createTx(nextNonce, jobs);
      const { nonce } = body;
      this.logger.debug(`[Job::${actionType}] tx created`, {
        id,
        nonce,
        raw: raw.toString('hex'),
      });

      // Update jobs
      await prisma.transaction.create({ data: { id, nonce, raw } });
      await prisma.job.updateMany({
        data: { processedAt: new Date() },
        where: { id: { in: jobIds } },
      });
      console.log(
        'data',
        ...jobs.map((job) => ({
          jobId: job.id,
          transactionId: id,
          retries: job.retries,
        })),
      );
      await prisma.jobExecution.createMany({
        data: [
          ...jobs.map((job) => ({
            jobId: job.id,
            transactionId: id,
            retries: (job.retries ?? -1) + 1,
          })),
        ],
      });
      this.logger.debug(`[Job::${actionType}] tx processed`, { id, jobIds });
    });
  }
}

function bigintMathMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}
