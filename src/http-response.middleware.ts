import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

@Injectable()
export class HttpResponseMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('node_http_request_count_total')
    private readonly httpRequestCounter: Counter<string>,
    @InjectMetric('node_http_response_count_total')
    private readonly httpResponseCounter: Counter<string>,
  ) {}

  use(req: any, res: any, next: (error?: any) => void) {
    if (req.url === '/metrics') return next();

    this.httpRequestCounter.labels({ method: req.method }).inc();

    res.on('finish', () => {
      this.httpResponseCounter
        .labels({ method: req.method, status_code: res.statusCode })
        .inc();
    });

    next();
  }
}
