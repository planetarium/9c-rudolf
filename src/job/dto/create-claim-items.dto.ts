import { Type } from 'class-transformer';
import { IsInt, IsObject, IsString, ValidateNested } from 'class-validator';
import { IsTicker } from 'src/utils/currency';

class Item {
  @IsTicker()
  public ticker: string;

  @IsInt()
  public amount: number;
}

export class CreateClaimItemsDto {
  @IsString()
  public id: string;

  @IsString()
  public avatarAddress: string;

  @IsObject()
  @ValidateNested()
  @Type(() => Item)
  public item: Item;
}
