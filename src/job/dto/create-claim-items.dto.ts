import { Type } from 'class-transformer';
import {
  IsHexadecimal,
  IsInt,
  IsObject,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { IsAvatarCurrency } from 'src/utils/currency';

class Item {
  @IsAvatarCurrency()
  public ticker: string;

  @IsInt()
  public amount: number;
}

export class CreateClaimItemsDto {
  @IsString()
  public id: string;

  @IsString()
  @IsHexadecimal()
  @Length(42, 42)
  public avatarAddress: string;

  @IsObject()
  @ValidateNested()
  @Type(() => Item)
  public item: Item;
}
