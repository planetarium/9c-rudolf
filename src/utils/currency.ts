import { ValidationOptions, registerDecorator } from 'class-validator';

type Currency = {
  type: 'constant' | 'prefix' | 'string_prefix';
  recipient: 'agent' | 'avatar';
  value: string;
};

const Currencies: Currency[] = [
  {
    type: 'constant',
    recipient: 'agent',
    value: 'NCG',
  },
  {
    type: 'constant',
    recipient: 'agent',
    value: 'Mead',
  },
  {
    type: 'constant',
    recipient: 'agent',
    value: 'CRYSTAL',
  },
  {
    type: 'constant',
    recipient: 'agent',
    value: 'GARAGE',
  },
  {
    type: 'prefix',
    recipient: 'avatar',
    value: 'rune_',
  },
  {
    type: 'prefix',
    recipient: 'avatar',
    value: 'runestone_',
  },
  {
    type: 'prefix',
    recipient: 'avatar',
    value: 'soulstone_',
  },
  {
    type: 'prefix',
    recipient: 'avatar',
    value: 'Item_T_',
  },
  {
    type: 'prefix',
    recipient: 'avatar',
    value: 'Item_NT_',
  },
  {
    type: 'string_prefix',
    recipient: 'avatar',
    value: 'FAV__',
  },
];

export const getCurrency = (ticker: string): Currency | null => {
  const currency = Currencies.find((c) => {
    if (c.type === 'constant') {
      return ticker === c.value;
    }
    if (c.type === 'prefix') {
      return (
        ticker.startsWith(c.value) &&
        Number.parseInt(ticker.slice(c.value.length)) > 0
      );
    }
    if (c.type === 'string_prefix') {
      return ticker.startsWith(c.value);
    }
    return false;
  });

  return currency ?? null;
};

export const isAvatarCurrency = (ticker: string): boolean => {
  const currency = getCurrency(ticker);

  return currency?.recipient === 'avatar' ?? false;
};

export const isAgentCurrency = (ticker: string): boolean => {
  const currency = getCurrency(ticker);

  return currency?.recipient === 'agent' ?? false;
};

export const IsTicker =
  (validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isTicker',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must be a valid ticker`,
        ...validationOptions,
      },
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') return false;
          return isAvatarCurrency(value) || isAgentCurrency(value);
        },
      },
    });
  };

export const IsAvatarCurrency =
  (validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isAvatarCurrency',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must be an avatar currency`,
        ...validationOptions,
      },
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') return false;
          return isAvatarCurrency(value);
        },
      },
    });
  };

export const IsAgentCurrency =
  (validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isAgentCurrency',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must be an agent currency`,
        ...validationOptions,
      },
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') return false;
          return isAgentCurrency(value);
        },
      },
    });
  };
