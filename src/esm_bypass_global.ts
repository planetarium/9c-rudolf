type Definition = {
  ['@planetarium/tx']: typeof import('@planetarium/tx') | null;
  ['@planetarium/account']: typeof import('@planetarium/account') | null;
  ['@planetarium/account-aws-kms']:
    | typeof import('@planetarium/account-aws-kms')
    | null;
};

export default {
  '@planetarium/tx': null,
  '@planetarium/account': null,
  '@planetarium/account-aws-kms': null,
} as Definition;
