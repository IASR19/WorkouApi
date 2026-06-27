import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/current-user.decorator';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('all')
  findAll() {
    return this.conversationsService.findAll();
  }

  @Get()
  findByUser(@CurrentUser() user: UserPayload) {
    return this.conversationsService.findByUser(user.sub, user.role);
  }

  @Get(':id/messages')
  findMessages(@Param('id') id: string) {
    return this.conversationsService.findMessages(id);
  }

  @Post()
  create(@Body() dto: CreateConversationDto) {
    return this.conversationsService.create(dto);
  }

  @Post(':id/messages')
  addMessage(@Param('id') id: string, @Body() dto: { body: string }, @CurrentUser() user: UserPayload) {
    return this.conversationsService.addMessage(id, user.sub, dto.body);
  }
}

