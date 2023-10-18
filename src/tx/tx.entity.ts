import type { SignedTx, UnsignedTx } from '@planetarium/tx/dist/tx';
import { TxResult } from '@prisma/client';
import axios from 'axios';

export interface Tx {
  id: string;
  body: SignedTx<UnsignedTx>;
  raw: Buffer;
}

export const getTxResult = async (id: string): Promise<TxResult | null> => {
  const { data } = await axios.post(
    `${process.env.GQL_ENDPOINT}`,
    JSON.stringify({
      query: `
      query {
        transaction {
          transactionResult(txId: "${id}") {
            txStatus}}}`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  const { txStatus } = data?.data?.transaction?.transactionResult ?? {};

  return txStatus ?? null;
};
