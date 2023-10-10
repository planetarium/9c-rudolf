import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BencodexDictionary } from '@planetarium/bencodex';
import type { Currency } from '@planetarium/tx';
import { Job } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TxService } from 'src/tx/tx.service';
import esm_bypass_global from 'src/esm_bypass_global';

const Address = esm_bypass_global["@planetarium/account"].Address;
const encodeCurrency = esm_bypass_global["@planetarium/tx"].encodeCurrency;

function encodeFungibleAssetValue(value) {
  return [encodeCurrency(value.currency), value.rawValue];
}

const TX_ACTIONS_SIZE = 50;

// FIXME: Get QUEUE_ADDRESS from external source (e.g., environment varibles).
const QUEUE_ADDRESS = Address.fromHex("0x0000000000000000000000000000000000000000");

// FIXME: Get NCG_MINTER from external source (e.g., environment varibles).
const NCG_MINTER = Address.fromHex("0x47D082a115c63E7b58B1532d20E631538eaFADde");

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly prismaService: PrismaService, private readonly txService: TxService) {}

  @Cron('00,10,20,30,40,50 * * * * *')
  async handleCron() {
    await this.prismaService.$transaction(async tx => {
      const claimItemJobs: Job[] = await tx.job.findMany({
        where: {
          transactionId: null,
          actionType: "CLAIM_ITEMS"
        },
        take: TX_ACTIONS_SIZE,
      });
      const claimItemsAction = createClaimItemsAction(claimItemJobs);
      const claimItemsTx = await this.txService.createTx(claimItemsAction);
      this.logger.debug("claimItemsTx", claimItemsTx);

      const transferAssetJobs: Job[] = await tx.job.findMany({
        where: {
          transactionId: null,
          actionType: "TRANSFER_ASSETS"
        },
        take: TX_ACTIONS_SIZE,
      });
      const transferAssetsAction = createTransferAssetsAction(transferAssetJobs);
      const transferAssetsTx = await this.txService.createTx(transferAssetsAction);
      this.logger.debug("transferAssetsTx", transferAssetsTx);
    });
  }
}

function createClaimItemsAction(jobs: Job[]) {
  return new BencodexDictionary([
    ["type_id", "claim_items"],
    ["values", new BencodexDictionary([
      ["id", guidToBytes(randomUUID())],
      ["cd", jobs.map(job => [
        Address.fromHex(job.address).toBytes(),
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
      ])]
    ])]
  ]);
}

const CURRENCIES: Record<string, Currency> = {
  "NCG": {
    ticker: "NCG",
    decimalPlaces: 2,
    minters: new Set([NCG_MINTER.toBytes()]),
    totalSupplyTrackable: false,
    maximumSupply: null,
  },
  "CRYSTAL": {
    ticker: "CRYSTAL",
    decimalPlaces: 18,
    minters: new Set(),
    totalSupplyTrackable: false,
    maximumSupply: null,
  },
}

function createTransferAssetsAction(jobs: Job[]) {
  return new BencodexDictionary([
    ["type_id", "transfer_assets"],
    ["values", new BencodexDictionary([
      ["sender", QUEUE_ADDRESS.toBytes()],
      ["recipients", jobs.map(job => [
        Address.fromHex(job.address).toBytes(),
        encodeFungibleAssetValue({
          currency: CURRENCIES[job.ticker],
          rawValue: BigInt(Math.pow(job.amount, 18))
        })
      ])]
    ])
  ]]);
}

function guidToBytes(guid) {
  return guid.split('-').reduce((bytes, section, index) => {
      const bytesInChar = section.match(/.{1,2}/g);
      if (index < 3) bytesInChar.reverse();
      return bytes.concat(bytesInChar.map(byte => parseInt(byte, 16)));
  }, []);
}
