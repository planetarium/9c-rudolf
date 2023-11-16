import { Type } from 'class-transformer';
import {
  IsObject,
  IsString,
  ValidateIf,
  ValidateNested,
  IsHexadecimal,
  Length,
  IsDefined,
  IsNumberString,
} from 'class-validator';
import {
  IsTicker,
  isAgentCurrency,
  isAvatarCurrency,
} from 'src/utils/currency';

class Item {
  @IsDefined()
  @IsTicker()
  public ticker: string;

  @IsDefined()
  @IsNumberString()
  public amount: string;
}

export class CreateTransferAssetsDto {
  @IsDefined()
  @IsString()
  public id: string;

  @ValidateIf((o: CreateTransferAssetsDto) => isAvatarCurrency(o.item.ticker))
  @IsDefined()
  @IsString()
  @IsHexadecimal()
  @Length(42, 42)
  public avatarAddress: string;

  @ValidateIf((o: CreateTransferAssetsDto) => isAgentCurrency(o.item.ticker))
  @IsDefined()
  @IsString()
  @IsHexadecimal()
  @Length(42, 42)
  public agentAddress: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => Item)
  public item: Item;
}
