import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
// import { Address } from '@planetarium/account';
// import { BencodexDictionary } from '@planetarium/bencodex';
// import { Currency, encodeFungibleAssetValue } from '@planetarium/tx/dist/assets';
import { Job } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

const TX_ACTIONS_SIZE = 50;

// FIXME: Get QUEUE_ADDRESS from external source (e.g., environment varibles).
// const QUEUE_ADDRESS = Address.fromHex("0x0000000000000000000000000000000000000000");

// FIXME: Get NCG_MINTER from external source (e.g., environment varibles).
// const NCG_MINTER = Address.fromHex("0x47d082a115c63e7b58b1532d20e631538eafadde");

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly prismaService: PrismaService) {}

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
      // TODO: Create ClaimItems TX.
      
      const transferAssetJobs: Job[] = await tx.job.findMany({
        where: {
          transactionId: null,
          actionType: "TRANSFER_ASSETS"
        },
        take: TX_ACTIONS_SIZE,
      });
      const transferAssetsAction = createTransferAssetsAction(transferAssetJobs);
      // TODO: Create TransferAssets TX.
    });
  }
}

function createClaimItemsAction(jobs: Job[]) {
  console.log("createClaimItemsAction", jobs);
  // return new BencodexDictionary([
  //   ["type_id", "claim_items"],
  //   ["values", new BencodexDictionary([
  //     ["id", guidToBytes(randomUUID())],
  //     ["cd", jobs.map(job => [
  //       Address.fromHex(job.address).toBytes(),
  //       encodeFungibleAssetValue({
  //         currency: {
  //           ticker: job.ticker,
  //           decimalPlaces: 18,
  //           minters: new Set(),
  //           totalSupplyTrackable: true,
  //           maximumSupply: null,
  //         },
  //         rawValue: BigInt(Math.pow(job.amount, 18)),
  //       }),
  //     ])]
  //   ])]
  // ]);
}

// const CURRENCIES: Record<string, Currency> = {
//   "NCG": {
//     ticker: "NCG",
//     decimalPlaces: 2,
//     minters: new Set([NCG_MINTER.toBytes()]),
//     totalSupplyTrackable: false,
//     maximumSupply: null,
//   },
//   "CRYSTAL": {
//     ticker: "CRYSTAL",
//     decimalPlaces: 18,
//     minters: new Set(),
//     totalSupplyTrackable: false,
//     maximumSupply: null,
//   },
// }

function createTransferAssetsAction(jobs: Job[]) {
  console.log("createTransferAssetsAction", jobs);
  // return new BencodexDictionary([
  //   ["type_id", "transfer_assets"],
  //   ["values", new BencodexDictionary([
  //     ["sender", QUEUE_ADDRESS.toBytes()],
  //     ["recipients", jobs.map(job => [
  //       Address.fromHex(job.address).toBytes(),
  //       encodeFungibleAssetValue({
  //         currency: CURRENCIES[job.ticker],
  //         rawValue: BigInt(Math.pow(job.amount, 18))
  //       })
  //     ])]
  //   ])
  // ]]);
}

function guidToBytes(guid) {
  return guid.split('-').reduce((bytes, section, index) => {
      const bytesInChar = section.match(/.{1,2}/g);
      if (index < 3) bytesInChar.reverse();
      return bytes.concat(bytesInChar.map(byte => parseInt(byte, 16)));
  }, []);
}
