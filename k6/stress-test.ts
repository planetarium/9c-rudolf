import http from 'k6/http';
import { sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  vus: 100000,
  duration: '1m',
  rps: 200,
};

const endpoint = 'http://localhost:3000/jobs/transfer-assets';

export default () => {
  const uuid = uuidv4();
  const body = {
    id: uuid,
    agentAddress: '0x803849F79Fb4869c49269079af0d39F1227dbe2c',
    item: {
      ticker: 'CRYSTAL',
      amount: 1,
    },
  };

  http.post(endpoint, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });

  sleep(1);
};
