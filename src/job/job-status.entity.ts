import { Job } from '@prisma/client';
import axios from 'axios';

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  STAGED = 'STAGED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export const getJobStatus = async (
  job: Job,
  transactionId: string,
): Promise<JobStatus> => {
  if (job.startedAt === null) return JobStatus.PENDING;
  if (job.processedAt === null) return JobStatus.PROCESSING;

  const { data } = await axios.post(
    `${process.env.GQL_ENDPOINT}`,
    JSON.stringify({
      query: `
      query {
        transaction {
          transactionResult(txId: "${transactionId}") {
            txStatus}}}`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  const { txStatus } = data?.data?.transaction?.transactionResult ?? {};

  if (txStatus === 'SUCCESS') return JobStatus.SUCCESS;
  if (txStatus === 'FAILURE') return JobStatus.FAILED;
  if (txStatus === 'STAGED') return JobStatus.STAGED;

  return JobStatus.PROCESSING;
};
