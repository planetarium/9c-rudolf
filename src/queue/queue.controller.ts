import { Inject, Injectable } from '@nestjs/common';
import { QueueService } from './queue.service';
import { Cron } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

const handleCronLock = 'HANDLE_CRON_LOCK';
const handleStagingCronLock = 'HANDLE_STAGING_CRON_LOCK';

@Injectable()
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManger: Cache,
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
}
