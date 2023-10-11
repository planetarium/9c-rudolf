import { Injectable } from '@nestjs/common';
import { BencodexDictionary } from '@planetarium/bencodex';
import type { Job } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import esm_bypass_global from 'src/esm_bypass_global';

import { CURRENCIES, QUEUE_ADDRESS } from './tx.constants';

const { Address } = esm_bypass_global['@planetarium/account'];
const { encodeCurrency } = esm_bypass_global['@planetarium/tx'];

@Injectable()
export class ActionService {
  public buildAction(jobs: Job[]) {
    if (jobs.every((job) => job.actionType === jobs[0].actionType)) {
      throw new Error('All jobs must have the same action type');
    }

    const actionType = jobs[0].actionType;
    const action =
      actionType === 'CLAIM_ITEMS'
        ? this.buildClaimItemsAction(jobs)
        : this.buildTransferAssetsAction(jobs);

    return action;
  }

  public buildTransferAssetsAction(jobs: Job[]) {
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
              this.encodeFungibleAssetValue({
                currency: CURRENCIES[job.ticker],
                rawValue: BigInt(Math.pow(job.amount, 18)),
              }),
            ]),
          ],
        ]),
      ],
    ]);
  }

  public buildClaimItemsAction(jobs: Job[]) {
    return new BencodexDictionary([
      ['type_id', 'claim_items'],
      [
        'values',
        new BencodexDictionary([
          ['id', this.guidToBytes(randomUUID())],
          [
            'cd',
            jobs.map((job) => [
              Address.fromHex(job.address, true).toBytes(),
              this.encodeFungibleAssetValue({
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

  private encodeFungibleAssetValue(value) {
    return [encodeCurrency(value.currency), value.rawValue];
  }

  private guidToBytes(guid: ReturnType<typeof randomUUID>) {
    return new Uint8Array(
      guid.split('-').reduce((bytes, section, index) => {
        const bytesInChar = section.match(/.{1,2}/g);
        if (index < 3) bytesInChar.reverse();
        return bytes.concat(bytesInChar.map((byte) => parseInt(byte, 16)));
      }, []),
    );
  }
}
