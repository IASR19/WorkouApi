import { Body, Controller, ForbiddenException, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('all')
  findAll(@Query() pagination: PaginationQueryDto, @CurrentUser() user: UserPayload) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem listar todas as conversas.');
    }
    return this.conversationsService.findAll(pagination);
  }

  @Get()
  findByUser(@CurrentUser() user: UserPayload) {
    return this.conversationsService.findByUser(user.sub, user.role);
  }

  @Get(':id/messages')
  findMessages(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.conversationsService.findMessages(user.sub, user.role, id);
  }

  @Post()
  create(@Body() dto: CreateConversationDto) {
    return this.conversationsService.create(dto);
  }

  @Post(':id/messages')
  addMessage(@Param('id') id: string, @Body() dto: { body: string }, @CurrentUser() user: UserPayload) {
    return this.conversationsService.addMessage(id, user.sub, user.role, dto.body);
  }
}

