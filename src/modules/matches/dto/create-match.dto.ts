import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateMatchDto {
  @IsUUID()
  jobId!: string;

  @IsUUID()
  candidateId!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsOptional()
  @IsString()
  scoreReason?: string;
}

