import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { BusinessException } from "../../common/exceptions/business.exception";
import { Match } from "../matches/entities/match.entity";
import { User } from "../users/entities/user.entity";
import { RecruiterProfile } from "../companies/entities/recruiter-profile.entity";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { paginate } from "../../common/dto/paginated-result";

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RecruiterProfile)
    private readonly profiles: Repository<RecruiterProfile>,
  ) {}

  async findAll(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [items, total] = await this.conversations.findAndCount({
      order: { createdAt: "DESC" },
      relations: {
        match: { candidate: { user: true }, job: { company: true } },
        messages: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(items, total, page, limit);
  }

  async assertCanAccessConversation(userId: string, role: string, conversationId: string) {
    const conversation = await this.conversations.findOne({
      where: { id: conversationId },
      relations: { match: { candidate: { user: true }, job: { createdBy: true, company: true } } },
    });
    if (!conversation) throw new NotFoundException("Conversa não encontrada");

    if (role === "candidate") {
      if (conversation.match.candidate.user?.id === userId) return conversation;
      throw new ForbiddenException("Você não tem acesso a esta conversa.");
    }

    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true },
    });
    const job = conversation.match.job;
    if (!profile || profile.company.id !== job?.company?.id) {
      throw new ForbiddenException("Você não tem acesso a esta conversa.");
    }
    const isOwner = profile.companyRole === "owner";
    const isJobCreator = job.createdBy?.id === profile.id;
    if (!isOwner && !isJobCreator) {
      throw new ForbiddenException("Você não tem acesso a esta conversa.");
    }
    return conversation;
  }

  async findByUser(userId: string, role: string) {
    if (role === "candidate") {
      return this.conversations.find({
        where: {
          match: {
            candidate: {
              user: { id: userId },
            },
          },
        },
        relations: {
          match: {
            candidate: { user: true },
            job: { company: true, createdBy: { user: true } },
          },
          messages: { sender: true },
        },
        order: {
          createdAt: "DESC",
        },
      });
    }

    // For recruiter, check if owner or manager
    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true },
    });

    if (!profile) {
      return [];
    }

    // Owner sees all conversations from company jobs
    if (profile.companyRole === "owner") {
      return this.conversations.find({
        where: {
          match: {
            job: {
              company: { id: profile.company.id },
            },
          },
        },
        relations: {
          match: {
            candidate: { user: true },
            job: { company: true, createdBy: { user: true } },
          },
          messages: { sender: true },
        },
        order: {
          createdAt: "DESC",
        },
      });
    }

    // Manager sees only conversations from their own jobs
    return this.conversations.find({
      where: {
        match: {
          job: {
            createdBy: { id: profile.id },
          },
        },
      },
      relations: {
        match: {
          candidate: { user: true },
          job: { company: true, createdBy: { user: true } },
        },
        messages: { sender: true },
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async findMessages(userId: string, role: string, conversationId: string) {
    await this.assertCanAccessConversation(userId, role, conversationId);
    return this.messages.find({
      where: { conversation: { id: conversationId } },
      relations: { sender: true },
      order: { createdAt: "ASC" },
    });
  }

  async create(dto: CreateConversationDto) {
    const match = await this.matches.findOneByOrFail({ id: dto.matchId });
    if (!match.isMutual) {
      throw new BusinessException(
        "Conversation can only be opened after a mutual match",
      );
    }
    return this.conversations.save(
      this.conversations.create({ match, unlocked: true }),
    );
  }

  async addMessage(conversationId: string, senderId: string, role: string, body: string) {
    const conversation = await this.assertCanAccessConversation(senderId, role, conversationId);
    const sender = await this.users.findOneByOrFail({ id: senderId });
    return this.messages.save(
      this.messages.create({ conversation, sender, body }),
    );
  }
}
