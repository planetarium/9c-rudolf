import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  IsTicker,
  isAgentCurrency,
  isAvatarCurrency,
} from 'src/utils/currency';

class Item {
  @IsTicker()
  public ticker: string;

  @IsInt()
  public amount: number;
}

export class CreateTransferAssetsDto {
  @IsString()
  public id: string;

  @ValidateIf((o: CreateTransferAssetsDto) => isAvatarCurrency(o.item.ticker))
  @IsString()
  public avatarAddress: string;

  @ValidateIf((o: CreateTransferAssetsDto) => isAgentCurrency(o.item.ticker))
  @IsString()
  public agentAddress: string;

  @IsObject()
  @ValidateNested()
  @Type(() => Item)
  public item: Item;
}
