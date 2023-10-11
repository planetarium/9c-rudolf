import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Account } from '@planetarium/account';
import { BencodexDictionary, Value, encode } from '@planetarium/bencodex';
import type { Currency } from '@planetarium/tx';
import type { SignedTx, UnsignedTx } from '@planetarium/tx/dist/tx';
import { PrismaService } from 'src/prisma/prisma.service';
import { createHash } from "node:crypto";
import esm_bypass_global from 'src/esm_bypass_global';
import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';

console.log(esm_bypass_global);
const { Address, PublicKey } = esm_bypass_global["@planetarium/account"];
const { encodeSignedTx, signTx } = esm_bypass_global["@planetarium/tx"];
const { AwsKmsAccount, KMSClient } = esm_bypass_global['@planetarium/account-aws-kms'];
const encodeCurrency = esm_bypass_global["@planetarium/tx"].encodeCurrency;

const GENESIS_BLOCK_HASH = Buffer.from("4582250d0da33b06779a8475d283d5dd210c683b9b999d74d03fac4f58fa6bce", "hex");
const SUPER_FUTURE_DATETIME = new Date(2200, 12, 31, 23, 59, 59, 999);

const MEAD_CURRENCY: Currency = {
    ticker: "Mead",
    decimalPlaces: 18,
    minters: new Set(),
    totalSupplyTrackable: false,
    maximumSupply: null,
} as const;

type PrismaTransactionClient = Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

@Injectable()
export class TxService {
  private readonly account: Account;

  constructor(private readonly prismaService: PrismaService, private readonly configService: ConfigService) {
    this.account = new AwsKmsAccount(
        configService.getOrThrow("AWS_KMS_KEY_ID"),
        PublicKey.fromHex(configService.getOrThrow("AWS_KMS_PUBLIC_KEY"), "uncompressed"),
        new KMSClient()
    );
  }

  async createTx(action: Value, tx: PrismaTransactionClient): Promise<[string, SignedTx<UnsignedTx>]> {
    const publicKey = PublicKey.fromHex(this.configService.getOrThrow("AWS_KMS_PUBLIC_KEY"), "uncompressed");
    const unsignedTx: UnsignedTx = {
        nonce: await this.#getNextNonce(tx),
        actions: [action],
        signer: Address.deriveFrom(publicKey).toBytes(),
        timestamp: SUPER_FUTURE_DATETIME,
        updatedAddresses: new Set(),
        publicKey: publicKey.toBytes("uncompressed"),
        genesisHash: GENESIS_BLOCK_HASH,
        gasLimit: this.assumeGasLimit(action),
        maxGasPrice: {
            currency: MEAD_CURRENCY,
            rawValue: BigInt(Math.pow(10, 18)),
        },
    };

    const signedTx = await signTx(unsignedTx, this.account);
    const raw = encode(encodeSignedTx(signedTx));

    const txid = createHash("sha256").update(raw).digest().toString("hex");
    console.log(signedTx);
    await tx.transaction.create({
        data: {
            id: txid,
            nonce: signedTx.nonce,
            raw: Buffer.from(raw),
        },
    });

    return [txid, signedTx];
  }

  async #getNextNonce(tx: PrismaTransactionClient): Promise<bigint> {
    const lastTx = await tx.transaction.findFirst({
        orderBy: {
            nonce: "desc"
        }
    });

    if (lastTx === null) {
        return 0n;
    }

    return lastTx.nonce + 1n;
  }

  assumeGasLimit(action: Value): bigint {
    if (action instanceof BencodexDictionary && action.has("type_id")) {
        const typeId = action.get("type_id");

        if (typeof typeId !== "string") {
            return 1n;
        }

        if (/transfer_asset\d*/.test(typeId) || /transfer_assets\d*/.test(typeId)) {
            return 4n;
        }
    }

    return 1n;
  }
}
