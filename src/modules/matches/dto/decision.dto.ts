import { IsEnum } from 'class-validator';

import { MatchDecision } from '../entities/match.entity';

export class DecisionDto {
  @IsEnum(MatchDecision)
  decision!: MatchDecision;
}

