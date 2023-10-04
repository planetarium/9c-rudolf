import { Body, Controller, Post } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateClaimItemsDto } from './dto/create-claim-items.dto';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('claim-items')
  public async claimItems(@Body() createClaimItemsDto: CreateClaimItemsDto) {
    const job = await this.jobService.createClaimItems(createClaimItemsDto);

    return { id: job.id, jobSequence: job.jobSequence };
  }
}
