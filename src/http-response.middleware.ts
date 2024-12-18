import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Request, Response } from 'express';
import { Counter } from 'prom-client';

@Injectable()
export class HttpResponseMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('node_http_request_count_total')
    private readonly httpRequestCounter: Counter<string>,
    @InjectMetric('node_http_response_count_total')
    private readonly httpResponseCounter: Counter<string>,
  ) {}

  use(req: Request, res: Response, next: (error?: unknown) => void) {
    if (req.baseUrl === '/metrics') return next();

    this.httpRequestCounter
      .labels({ method: req.method, url: req.baseUrl })
      .inc();

    res.on('finish', () => {
      this.httpResponseCounter
        .labels({
          method: req.method,
          url: req.baseUrl,
          status_code: res.statusCode,
        })
        .inc();
    });

    next();
  }
}
