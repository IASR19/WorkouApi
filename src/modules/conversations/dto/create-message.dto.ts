import { IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  senderId!: string;

  @IsString()
  body!: string;
}

