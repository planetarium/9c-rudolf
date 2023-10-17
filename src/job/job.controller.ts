import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateClaimItemsDto } from './dto/create-claim-items.dto';
import { CreateTransferAssetsDto } from './dto/create-transfer-assets.dto';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get(':id')
  public async getJob(@Param('id') id: string) {
    const job = await this.jobService.getJob(id);
    const addressKey = `${job.currency.recipient}Address`;

    return {
      id: job.id,
      actionType: job.actionType,
      [addressKey]: job.address,
      status: job.status,
      retries: job.retries,
      transactionId: job.transactionId,
      item: {
        ticker: job.ticker,
        amount: job.amount,
      },
    };
  }

  @Post('claim-items')
  public async claimItems(@Body() createClaimItemsDto: CreateClaimItemsDto) {
    const job = await this.jobService.createClaimItems(createClaimItemsDto);

    return { id: job.id, jobSequence: job.jobSequence };
  }

  @Post('transfer-assets')
  public async transferAssets(
    @Body() createTransferAssetsDto: CreateTransferAssetsDto,
  ) {
    const job = await this.jobService.createTransferAssets(
      createTransferAssetsDto,
    );

    return { id: job.id, jobSequence: job.jobSequence };
  }
}
