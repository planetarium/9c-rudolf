import { Injectable, Logger } from '@nestjs/common';
import { BencodexDictionary } from '@planetarium/bencodex';
import type { Currency } from '@planetarium/tx';
import { ActionType, Job } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TxService } from 'src/tx/tx.service';
import esm_bypass_global from 'src/esm_bypass_global';

const Address = esm_bypass_global['@planetarium/account'].Address;
const encodeCurrency = esm_bypass_global['@planetarium/tx'].encodeCurrency;

function encodeFungibleAssetValue(value) {
  return [encodeCurrency(value.currency), value.rawValue];
}

const TX_ACTIONS_SIZE = 50;

// FIXME: Get QUEUE_ADDRESS from external source (e.g., environment varibles).
const QUEUE_ADDRESS = Address.fromHex(
  '0x0000000000000000000000000000000000000000',
);

// FIXME: Get NCG_MINTER from external source (e.g., environment varibles).
const NCG_MINTER = Address.fromHex(
  '0x47D082a115c63E7b58B1532d20E631538eaFADde',
);

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

      // Get next nonce
      const lastTx = await prisma.transaction.findFirst({
        orderBy: { nonce: 'desc' },
        select: { nonce: true },
      });
      const nextNonce = lastTx ? lastTx.nonce + 1n : 0n;

      // Create tx
      const action =
        actionType === ActionType.CLAIM_ITEMS
          ? createClaimItemsAction(jobs)
          : createTransferAssetsAction(jobs);
      const [id, { nonce }, raw] = await this.txService.createTx(
        nextNonce,
        action,
      );
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

function createClaimItemsAction(jobs: Job[]) {
  return new BencodexDictionary([
    ['type_id', 'claim_items'],
    [
      'values',
      new BencodexDictionary([
        ['id', guidToBytes(randomUUID())],
        [
          'cd',
          jobs.map((job) => [
            Address.fromHex(job.address, true).toBytes(),
            encodeFungibleAssetValue({
              currency: {
                ticker: job.ticker,
                decimalPlaces: 18,
                minters: new Set(),
                totalSupplyTrackable: true,
                maximumSupply: null,
              },
              rawValue: BigInt(Math.pow(job.amount, 18)),
            }),
          ]),
        ],
      ]),
    ],
  ]);
}

const CURRENCIES: Record<string, Currency> = {
  NCG: {
    ticker: 'NCG',
    decimalPlaces: 2,
    minters: new Set([NCG_MINTER.toBytes()]),
    totalSupplyTrackable: false,
    maximumSupply: null,
  },
  CRYSTAL: {
    ticker: 'CRYSTAL',
    decimalPlaces: 18,
    minters: new Set(),
    totalSupplyTrackable: false,
    maximumSupply: null,
  },
};

function createTransferAssetsAction(jobs: Job[]) {
  return new BencodexDictionary([
    ['type_id', 'transfer_assets'],
    [
      'values',
      new BencodexDictionary([
        ['sender', QUEUE_ADDRESS.toBytes()],
        [
          'recipients',
          jobs.map((job) => [
            Address.fromHex(job.address, true).toBytes(),
            encodeFungibleAssetValue({
              currency: CURRENCIES[job.ticker],
              rawValue: BigInt(Math.pow(job.amount, 18)),
            }),
          ]),
        ],
      ]),
    ],
  ]);
}

function guidToBytes(guid) {
  return new Uint8Array(
    guid.split('-').reduce((bytes, section, index) => {
      const bytesInChar = section.match(/.{1,2}/g);
      if (index < 3) bytesInChar.reverse();
      return bytes.concat(bytesInChar.map((byte) => parseInt(byte, 16)));
    }, []),
  );
}
