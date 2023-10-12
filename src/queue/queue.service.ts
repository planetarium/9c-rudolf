import { Injectable, Logger } from '@nestjs/common';
import { ActionType } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { TxService } from 'src/tx/tx.service';

const TX_ACTIONS_SIZE = 50;

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly txService: TxService,
  ) {}

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
      this.logger.log('There is no tx to stage.');
      return;
    }

    const { raw, id } = tx;
    this.logger.debug('Stage', id);
    await this.txService.stageTx(raw.toString('hex'));
  }

  private async processJob(actionType: ActionType) {
    await this.prismaService.$transaction(async (prisma) => {
      this.logger.debug(`[Job::${actionType}] started`);

      // Collect jobs
      const jobs = await prisma.job.findMany({
        where: {
          actionType,
          transactionId: null,
        },
        take: TX_ACTIONS_SIZE,
      });
      const jobIds = jobs.map((job) => job.id);
      this.logger.debug(`[Job::${actionType}] ${jobs.length} jobs found}`);

      if (jobs.length === 0) {
        this.logger.log('There is no jobs to create tx. :D');
        return;
      }

      // Get next nonce
      const lastTx = await prisma.transaction.findFirst({
        orderBy: { nonce: 'desc' },
        select: { nonce: true },
      });
      const nextNonce = lastTx ? lastTx.nonce + 1n : 0n;

      // Create tx
      const { id, body, raw } = await this.txService.createTx(nextNonce, jobs);
      const { nonce } = body;
      this.logger.debug(`[Job::${actionType}] tx created`, { id, nonce, raw });

      // Update jobs
      await prisma.transaction.create({ data: { id, nonce, raw } });
      await prisma.job.updateMany({
        data: { transactionId: id },
        where: { id: { in: jobIds } },
      });
      this.logger.debug(`[Job::${actionType}] tx processed`, { id, jobIds });
    });
  }
}
