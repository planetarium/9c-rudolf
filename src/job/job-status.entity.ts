import { Job } from '@prisma/client';

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  STAGED = 'STAGED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export const getJobStatus = async (job: Job): Promise<JobStatus> => {
  if (job.transactionId === null) return JobStatus.PENDING;
  if (job.processedAt === null) return JobStatus.PROCESSING;

  // TODO: Check if transaction is confirmed
  return JobStatus.SUCCESS;
};
