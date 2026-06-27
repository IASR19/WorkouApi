import { BadRequestException } from '@nestjs/common';

export class BusinessException extends BadRequestException {
  constructor(message: string, public readonly errorCode = 'BUSINESS_RULE_VIOLATION') {
    super({ message, errorCode });
  }
}

