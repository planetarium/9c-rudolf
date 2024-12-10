import { Module } from '@nestjs/common';
import { TxModule } from 'src/tx/tx.module';
import { JobController } from './job.controller';
import { JobService } from './job.service';

@Module({
  imports: [TxModule],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
