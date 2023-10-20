import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { TxModule } from 'src/tx/tx.module';

@Module({
  imports: [TxModule],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
