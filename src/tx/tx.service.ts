import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Account } from '@planetarium/account';
import { BencodexDictionary, Value, encode } from '@planetarium/bencodex';
import type { Currency } from '@planetarium/tx';
import type { SignedTx, UnsignedTx } from '@planetarium/tx/dist/tx';
import { PrismaService } from 'src/prisma/prisma.service';
import { createHash } from "node:crypto";
import esm_bypass_global from 'src/esm_bypass_global';

console.log(esm_bypass_global);
const { Address, PublicKey } = esm_bypass_global["@planetarium/account"];
const { encodeSignedTx, signTx } = esm_bypass_global["@planetarium/tx"];
const { AwsKmsAccount, KMSClient } = esm_bypass_global['@planetarium/account-aws-kms'];
const encodeCurrency = esm_bypass_global["@planetarium/tx"].encodeCurrency;

const QUEUE_ADDRESS = Address.fromHex("0x0000000000000000000000000000000000000000");
const QUEUE_PUBLIC_KEY = PublicKey.fromHex("03c392ee2a8689e3f0ced0c96af6ee514449698b262ec2b56a3e7eadae237af3f0", "compressed");
const GENESIS_BLOCK_HASH = Buffer.from("4582250d0da33b06779a8475d283d5dd210c683b9b999d74d03fac4f58fa6bce", "hex");
const SUPER_FUTURE_DATETIME = new Date(2200, 12, 31, 23, 59, 59, 999);

const MEAD_CURRENCY: Currency = {
    ticker: "Mead",
    decimalPlaces: 18,
    minters: new Set(),
    totalSupplyTrackable: false,
    maximumSupply: null,
} as const;

@Injectable()
export class TxService {
  private readonly account: Account;

  constructor(private readonly prismaService: PrismaService, private readonly configService: ConfigService) {
    this.account = new AwsKmsAccount(
        this.configService.getOrThrow("AWS_KMS_KEY_ID"),
        PublicKey.fromHex(configService.getOrThrow("AWS_KMS_PUBLIC_KEY"), "uncompressed"),
        new KMSClient({
            credentials: {
                accessKeyId: this.configService.getOrThrow("AWS_KMS_ACCESS_KEY_ID"),
                secretAccessKey: this.configService.getOrThrow("AWS_KMS_SECRET_ACCESS_KEY"),
            }
        })
    );
  }

  async createTx(action: Value): Promise<SignedTx<UnsignedTx>> {
    return await this.prismaService.$transaction(async tx => {
        const unsignedTx: UnsignedTx = {
            nonce: await this.#getNextNonce(),
            actions: [action],
            signer: QUEUE_ADDRESS.toBytes(),
            timestamp: SUPER_FUTURE_DATETIME,
            updatedAddresses: new Set(),
            publicKey: QUEUE_PUBLIC_KEY.toBytes("uncompressed"),
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
        await tx.transaction.create({
            data: {
                id: txid,
                nonce: signedTx.nonce,
                raw: Buffer.from(raw),
            },
        });

        return signedTx;
    });
  }

  async #getNextNonce(): Promise<bigint> {
    const tx = await this.prismaService.transaction.findFirst({
        orderBy: {
            nonce: "desc"
        }
    });

    return tx.nonce;
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
