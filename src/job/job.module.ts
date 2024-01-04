import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { TxModule } from 'src/tx/tx.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [TxModule, PrismaModule],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
