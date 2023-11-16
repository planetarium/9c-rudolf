import { Type } from 'class-transformer';
import {
  IsDefined,
  IsHexadecimal,
  IsNumberString,
  IsObject,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { IsAvatarCurrency } from 'src/utils/currency';

class Item {
  @IsDefined()
  @IsAvatarCurrency()
  public ticker: string;

  @IsDefined()
  @IsNumberString()
  public amount: string;
}

export class CreateClaimItemsDto {
  @IsDefined()
  @IsString()
  public id: string;

  @IsDefined()
  @IsString()
  @IsHexadecimal()
  @Length(42, 42)
  public avatarAddress: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => Item)
  public item: Item;
}
