import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message extends BaseEntity {
  @Column({ type: 'text' })
  body!: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  conversation!: Conversation;

  @ManyToOne(() => User)
  sender!: User;
}

