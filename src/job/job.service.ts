import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClaimItemsDto } from './dto/create-claim-items.dto';
import { CreateTransferAssetsDto } from './dto/create-transfer-assets.dto';

@Injectable()
export class JobService {
  constructor(private readonly prismaService: PrismaService) {}

  async createClaimItems(dto: CreateClaimItemsDto) {
    return await this.prismaService.$transaction(async (tx) => {
      const isExisting = await tx.job.findUnique({
        where: { id: dto.id },
      });
      if (isExisting) throw new BadRequestException('Job already exists');

      const job = await tx.job.create({
        data: {
          id: dto.id,
          actionType: 'CLAIM_ITEMS',
          address: dto.avatarAddress,
          ticker: dto.item.ticker,
          amount: dto.item.amount,
        },
      });

      const jobSequence = await this.prismaService.job.count({
        where: { createdAt: { lt: job.createdAt }, processedAt: null },
      });

      return { ...job, jobSequence: jobSequence + 1 };
    });
  }

  async createTransferAssets(dto: CreateTransferAssetsDto) {
    return await this.prismaService.$transaction(async (tx) => {
      const isExisting = await tx.job.findUnique({
        where: { id: dto.id },
      });
      if (isExisting) throw new BadRequestException('Job already exists');

      const address = dto.avatarAddress ?? dto.agentAddress;
      const job = await tx.job.create({
        data: {
          id: dto.id,
          actionType: 'TRANSFER_ASSETS',
          address,
          ticker: dto.item.ticker,
          amount: dto.item.amount,
        },
      });

      const jobSequence = await tx.job.count({
        where: { createdAt: { lt: job.createdAt }, processedAt: null },
      });

      return { ...job, jobSequence: jobSequence + 1 };
    });
  }
}
