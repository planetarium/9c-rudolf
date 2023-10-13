import type { Currency } from '@planetarium/tx';

import esm_bypass_global from 'src/esm_bypass_global';

const { Address } = esm_bypass_global['@planetarium/account'];

// FIXME: Get QUEUE_ADDRESS from external source (e.g., environment varibles).
export const QUEUE_ADDRESS = Address.fromHex(
  '0x0000000000000000000000000000000000000000',
);

// FIXME: Get NCG_MINTER from external source (e.g., environment varibles).
export const NCG_MINTER = Address.fromHex(
  '0x47D082a115c63E7b58B1532d20E631538eaFADde',
);

export const GENESIS_BLOCK_HASH = Buffer.from(
  '4930365a81cc90de4372a68efb2aff4eaf12d2f5383903f9ccbb535df4ffe566',
  'hex',
);

export const SUPER_FUTURE_DATETIME = new Date(2200, 12, 31, 23, 59, 59, 999);

export const CURRENCIES: Record<string, Currency> = {
  NCG: {
    ticker: 'NCG',
    decimalPlaces: 2,
    minters: new Set([NCG_MINTER.toBytes()]),
    totalSupplyTrackable: false,
    maximumSupply: null,
  },
  CRYSTAL: {
    ticker: 'CRYSTAL',
    decimalPlaces: 18,
    minters: null,
    totalSupplyTrackable: false,
    maximumSupply: null,
  },
  MEAD: {
    ticker: 'Mead',
    decimalPlaces: 18,
    minters: null,
    totalSupplyTrackable: false,
    maximumSupply: null,
  },
};
