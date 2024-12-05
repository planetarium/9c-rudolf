import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job, TxResult } from '@prisma/client';
import type { Account } from '@planetarium/account';
import type { UnsignedTx } from '@planetarium/tx/dist/tx';
import { BencodexDictionary, Value, encode } from '@planetarium/bencodex';
import { createHash } from 'node:crypto';

import { CURRENCIES, SUPER_FUTURE_DATETIME } from './tx.constants';
import { ActionService } from './action.service';
import { Tx } from './tx.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { Address, PublicKey } from '@planetarium/account';
import { AwsKmsAccount, KMSClient } from '@planetarium/account-aws-kms';
import { encodeSignedTx, signTx } from '@planetarium/tx';

@Injectable()
export class TxService {
  private readonly account: Account;
  private readonly graphqlEndpoint: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly actionBuilder: ActionService,
    private readonly httpService: HttpService,
  ) {
    const nullableAwsAccessKeyId = this.configService.get(
      'AWS_KMS_ACCESS_KEY_ID',
    );
    const nullableAwsSecretAccessKey = this.configService.get(
      'AWS_KMS_SECRET_ACCESS_KEY',
    );
    this.account = new AwsKmsAccount(
      configService.getOrThrow('AWS_KMS_KEY_ID'),
      PublicKey.fromHex(
        configService.getOrThrow('AWS_KMS_PUBLIC_KEY'),
        'uncompressed',
      ),
      new KMSClient(
        nullableAwsAccessKeyId !== undefined &&
          nullableAwsSecretAccessKey !== undefined
          ? {
              credentials: {
                accessKeyId: nullableAwsAccessKeyId,
                secretAccessKey: nullableAwsSecretAccessKey,
              },
            }
          : undefined,
      ),
    );
    this.graphqlEndpoint = configService.getOrThrow('NC_GRAPHQL_ENDPOINT');
  }

  public async createTx(nonce: bigint, jobs: Job[]) {
    if (!jobs.every((job) => job.actionType === jobs[0].actionType)) {
      throw new Error('All jobs must have the same action type');
    }

    const signerAddress = await this.account.getAddress();
    const action = this.actionBuilder.buildAction(signerAddress, jobs);

    return await this.createTxWithAction(nonce, action);
  }

  async stageTx(unverifiedTransaction: string) {
    const source = this.httpService.post(this.graphqlEndpoint, {
      query: `
        mutation StageTransaction($payload: String!) {
          stageTransaction(payload: $payload)
        }`,
      operationName: 'StageTransaction',
      variables: {
        payload: unverifiedTransaction,
      },
    });

    return await firstValueFrom(source);
  }

  async getNextNonceFromRemote(): Promise<number> {
    const responseSource = this.httpService.post(this.graphqlEndpoint, {
      query: `
        query GetNextNonce($address: Address!) {
          transaction {
            nextTxNonce(address: $address)
          }
        }`,
      operationName: 'GetNextNonce',
      variables: {
        address: await this.account.getAddress().then((x) => x.toString()),
      },
    });
    const response = await firstValueFrom(responseSource);
    const returnValue = response.data.data.transaction.nextTxNonce;
    if (typeof returnValue !== 'number') {
      throw new Error('Unexpected response.');
    }

    return returnValue;
  }

  async getTxResult(id: string): Promise<TxResult | null> {
    const query = `
    query {
      transaction {
        transactionResult(txId: "${id}") {
          txStatus
        }}}`;
    const responseSource = this.httpService.post(
      this.graphqlEndpoint,
      JSON.stringify({ query }),
    );

    const { data } = await firstValueFrom(responseSource);
    const { txStatus } = data?.data?.transaction?.transactionResult ?? {};

    return txStatus ?? null;
  }

  private async createTxWithAction(nonce: bigint, action: Value): Promise<Tx> {
    const genesisHash = Buffer.from(
      this.configService.getOrThrow<string>('GENESIS_BLOCK_HASH'),
      'hex',
    );
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
      genesisHash: genesisHash,
      gasLimit: this.assumeGasLimit(action),
      maxGasPrice: {
        currency: CURRENCIES['MEAD'],
        rawValue: BigInt(Math.pow(10, 18)),
      },
    };

    const signedTx = await signTx(unsignedTx, this.account);
    const raw = encode(encodeSignedTx(signedTx));
    const rawBuffer = Buffer.from(raw);
    const id = createHash('sha256').update(raw).digest().toString('hex');

    return { id, body: signedTx, raw: rawBuffer };
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
