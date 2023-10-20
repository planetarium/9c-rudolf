import { TxResult } from '@prisma/client';

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  STAGED = 'STAGED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export const getJobStatusFromTxResult = (txResult: TxResult) => {
  if (txResult === 'SUCCESS') return JobStatus.SUCCESS;
  if (txResult === 'FAILURE') return JobStatus.FAILED;
  if (txResult === 'STAGING') return JobStatus.STAGED;
  return JobStatus.PROCESSING;
};
