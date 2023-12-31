import type { Currency } from '@planetarium/tx';

import { Address } from '@planetarium/account';

// FIXME: Get NCG_MINTER from external source (e.g., environment varibles).
export const NCG_MINTER = process.env.NCG_MINTER
  ? Address.fromHex(process.env.NCG_MINTER)
  : null;

export const SUPER_FUTURE_DATETIME = new Date(2200, 12, 31, 23, 59, 59, 999);

export const CURRENCIES: Record<string, Currency> = {
  NCG: {
    ticker: 'NCG',
    decimalPlaces: 2,
    minters: NCG_MINTER ? new Set([NCG_MINTER.toBytes()]) : null,
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
  FAV__CRYSTAL: {
    ticker: 'FAV__CRYSTAL',
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
