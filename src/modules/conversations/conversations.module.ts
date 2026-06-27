import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Match } from '../matches/entities/match.entity';
import { User } from '../users/entities/user.entity';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Match, User])],
  controllers: [ConversationsController],
  providers: [ConversationsService]
})
export class ConversationsModule {}

