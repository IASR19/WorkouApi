import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Match } from '../../matches/entities/match.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation extends BaseEntity {
  @Column({ default: true })
  unlocked!: boolean;

  @ManyToOne(() => Match)
  match!: Match;

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];
}

