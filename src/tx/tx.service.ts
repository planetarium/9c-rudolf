import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from '@prisma/client';
import type { Account } from '@planetarium/account';
import type { SignedTx, UnsignedTx } from '@planetarium/tx/dist/tx';
import { BencodexDictionary, Value, encode } from '@planetarium/bencodex';
import { createHash } from 'node:crypto';

import esm_bypass_global from 'src/esm_bypass_global';

import {
  CURRENCIES,
  GENESIS_BLOCK_HASH,
  SUPER_FUTURE_DATETIME,
} from './tx.constants';
import { ActionService } from './action.service';

const { Address, PublicKey } = esm_bypass_global['@planetarium/account'];
const { AwsKmsAccount, KMSClient } =
  esm_bypass_global['@planetarium/account-aws-kms'];
const { encodeSignedTx, signTx } = esm_bypass_global['@planetarium/tx'];

@Injectable()
export class TxService {
  private readonly account: Account;

  constructor(
    private readonly configService: ConfigService,
    private readonly actionBuilder: ActionService,
  ) {
    this.account = new AwsKmsAccount(
      configService.getOrThrow('AWS_KMS_KEY_ID'),
      PublicKey.fromHex(
        configService.getOrThrow('AWS_KMS_PUBLIC_KEY'),
        'uncompressed',
      ),
      new KMSClient(),
    );
  }

  public async createTx(nonce: bigint, jobs: Job[]) {
    if (jobs.every((job) => job.actionType === jobs[0].actionType)) {
      throw new Error('All jobs must have the same action type');
    }

    const action = this.actionBuilder.buildAction(jobs);

    return await this.createTxWithAction(nonce, action);
  }

  private async createTxWithAction(
    nonce: bigint,
    action: Value,
  ): Promise<[string, SignedTx<UnsignedTx>, Buffer]> {
    const publicKey = PublicKey.fromHex(
      this.configService.getOrThrow('AWS_KMS_PUBLIC_KEY'),
      'uncompressed',
    );
    const unsignedTx: UnsignedTx = {
      nonce,
      actions: [action],
      signer: Address.deriveFrom(publicKey).toBytes(),
      timestamp: SUPER_FUTURE_DATETIME,
      updatedAddresses: new Set(),
      publicKey: publicKey.toBytes('uncompressed'),
      genesisHash: GENESIS_BLOCK_HASH,
      gasLimit: this.assumeGasLimit(action),
      maxGasPrice: {
        currency: CURRENCIES['MEAD'],
        rawValue: BigInt(Math.pow(10, 18)),
      },
    };

    const signedTx = await signTx(unsignedTx, this.account);
    const raw = encode(encodeSignedTx(signedTx));
    const rawBuffer = Buffer.from(raw);

    const txid = createHash('sha256').update(raw).digest().toString('hex');

    return [txid, signedTx, rawBuffer];
  }

  private assumeGasLimit(action: Value): bigint {
    if (!(action instanceof BencodexDictionary) || !action.has('type_id')) {
      return 1n;
    }

    const typeId = action.get('type_id');
    if (typeof typeId !== 'string') {
      return 1n;
    }

    if (/transfer_asset\d*/.test(typeId) || /transfer_assets\d*/.test(typeId)) {
      return 4n;
    }

    return 1n;
  }
}
