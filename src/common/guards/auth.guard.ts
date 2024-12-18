import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequireAuthToken } from '../decorators/required-auth-token.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaSerivce: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.get(RequireAuthToken, context.getHandler())) {
      const header = context
        .switchToHttp()
        .getRequest<Request>()
        .header('Authorization');

      if (!header) {
        return false;
      }

      const splat = header.split(' ');
      if (splat.length === 2 && splat[0] === 'Bearer') {
        const authToken = await this.prismaSerivce.authToken.findUnique({
          where: {
            token: splat[1],
          },
        });

        if (authToken?.token) {
          return true;
        }
      }

      return false;
    }

    return true;
  }
}
