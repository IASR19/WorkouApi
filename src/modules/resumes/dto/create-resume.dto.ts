import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateResumeDto {
  @IsUUID()
  candidateId!: string;

  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  storageUrl?: string;

  @IsOptional()
  @IsString()
  parsedSummary?: string;
}

