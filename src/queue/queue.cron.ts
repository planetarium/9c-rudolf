import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Cache } from 'cache-manager';
import { Gauge } from 'prom-client';
import { QueueService } from './queue.service';

const handleCronLock = 'HANDLE_CRON_LOCK';
const handleStagingCronLock = 'HANDLE_STAGING_CRON_LOCK';

@Injectable()
export class QueueCronController {
  constructor(
    private readonly queueService: QueueService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManger: Cache,
    @InjectMetric('rudolf_total_jobs')
    private readonly totalJobsGauge: Gauge<string>,
    @InjectMetric('rudolf_remaining_jobs')
    private readonly remainingJobsGauge: Gauge<string>,
    @InjectMetric('rudolf_failed_jobs')
    private readonly failedJobsGauge: Gauge<string>,
  ) {}

  @Cron('00,10,20,30,40,50 * * * * *')
  async handleCron() {
    const lock = await this.cacheManger.get(handleCronLock);
    if (lock) return;

    try {
      await this.cacheManger.set(handleCronLock, true, 30 * 1000);
      await this.queueService.handleCron();
    } finally {
      await this.cacheManger.set(handleCronLock, false, 30 * 1000);
    }
  }

  @Cron('05,15,25,35,45,55 * * * * *')
  async handleStagingCron() {
    const lock = await this.cacheManger.get(handleStagingCronLock);
    if (lock) return;

    try {
      await this.cacheManger.set(handleStagingCronLock, true, 30 * 1000);
      await this.queueService.handleStagingCron();
    } finally {
      await this.cacheManger.set(handleStagingCronLock, false, 30 * 1000);
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleSyncPrometheus() {
    const { jobs, failedJobs, pendingJobs } =
      await this.queueService.getJobCounts();

    this.totalJobsGauge.set(jobs);
    this.remainingJobsGauge.set(pendingJobs);
    this.failedJobsGauge.set(failedJobs);
  }
}
