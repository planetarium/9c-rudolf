import type { SignedTx, UnsignedTx } from '@planetarium/tx/dist/tx';

export interface Tx {
  id: string;
  body: SignedTx<UnsignedTx>;
  raw: Buffer;
}
