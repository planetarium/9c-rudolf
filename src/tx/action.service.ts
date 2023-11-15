import { Injectable } from '@nestjs/common';
import { BencodexDictionary } from '@planetarium/bencodex';
import type { Job } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { CURRENCIES } from './tx.constants';
import type { Address as AddressType } from '@planetarium/account';

import { Address } from '@planetarium/account';
import { encodeCurrency } from '@planetarium/tx';

@Injectable()
export class ActionService {
  public buildAction(signer: AddressType, jobs: Job[]) {
    if (!jobs.every((job) => job.actionType === jobs[0].actionType)) {
      throw new Error('All jobs must have the same action type');
    }

    const actionType = jobs[0].actionType;
    const action =
      actionType === 'CLAIM_ITEMS'
        ? this.buildClaimItemsAction(jobs)
        : this.buildTransferAssetsAction(signer, jobs);

    return action;
  }

  public buildTransferAssetsAction(signer: AddressType, jobs: Job[]) {
    return new BencodexDictionary([
      ['type_id', 'transfer_assets3'],
      [
        'values',
        new BencodexDictionary([
          ['sender', signer.toBytes()],
          [
            'recipients',
            jobs.map((job) => [
              Address.fromHex(job.address, true).toBytes(),
              this.encodeFungibleAssetValue({
                currency: CURRENCIES[job.ticker],
                rawValue: BigInt(
                  job.amount *
                    Math.pow(10, CURRENCIES[job.ticker].decimalPlaces),
                ),
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
              [
                this.encodeFungibleAssetValue({
                  currency: {
                    ticker: job.ticker,
                    decimalPlaces: 0,
                    minters: null,
                    totalSupplyTrackable: false,
                    maximumSupply: null,
                  },
                  rawValue: BigInt(job.amount),
                }),
              ],
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
