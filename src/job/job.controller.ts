import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RequireAuthToken } from 'src/common/decorators/required-auth-token.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CreateClaimItemsEventDto } from './dto/create-claim-items-event.dto';
import { CreateClaimItemsDto } from './dto/create-claim-items.dto';
import { CreateTransferAssetsDto } from './dto/create-transfer-assets.dto';
import { JobService } from './job.service';

@UseGuards(AuthGuard)
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
      jobSequence: job.jobSequence,
      item: {
        ticker: job.ticker,
        amount: job.amount,
      },
    };
  }

  @Get('events/:id')
  public async getJobsByEvent(@Param('id') id: string) {
    const jobs = await this.jobService.getJobsByEvent(id);

    return {
      id,
      jobs: jobs.map((job) => ({
        id: job.id,
        actionType: job.actionType,
        avatarAddress: job.address,
        ticker: job.ticker,
        amount: job.amount,
        status: job.executions[0]?.transaction?.lastStatus ?? null,
        transactionId: job.executions[0]?.transactionId ?? null,
        transactionStatus: job.executions[0]?.transaction?.lastStatus ?? null,
        retries: job.executions[0]?.retries ?? 0,
      })),
    };
  }

  @Post('events')
  @RequireAuthToken()
  public async createJobsByEvent(@Body() dto: CreateClaimItemsEventDto) {
    const job = await this.jobService.createJobsByEvent(dto);

    return job;
  }

  @Post('claim-items')
  @RequireAuthToken()
  public async claimItems(@Body() createClaimItemsDto: CreateClaimItemsDto) {
    const job = await this.jobService.createClaimItems(createClaimItemsDto);

    return { id: job.id, jobSequence: job.jobSequence };
  }

  @Post('transfer-assets')
  @RequireAuthToken()
  public async transferAssets(
    @Body() createTransferAssetsDto: CreateTransferAssetsDto,
  ) {
    const job = await this.jobService.createTransferAssets(
      createTransferAssetsDto,
    );

    return { id: job.id, jobSequence: job.jobSequence };
  }
}
