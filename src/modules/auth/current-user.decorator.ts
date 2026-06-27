import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  sub: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
