import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsHexadecimal,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { IsAvatarCurrency } from 'src/utils/currency';

export class Item {
  @IsOptional()
  @IsString()
  public id?: string;

  @IsDefined()
  @IsString()
  @IsHexadecimal()
  @Length(42, 42)
  public avatarAddress: string;

  @IsDefined()
  @IsAvatarCurrency()
  public ticker: string;

  @IsDefined()
  @IsNumberString()
  public amount: string;
}

export class CreateClaimItemsEventDto {
  @IsDefined()
  @IsString()
  eventId: string;

  @IsDefined()
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @ArrayMaxSize(5000)
  @Type(() => Item)
  public items: Item[];
}
