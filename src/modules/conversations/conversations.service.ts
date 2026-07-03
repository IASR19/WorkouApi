import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { BusinessException } from "../../common/exceptions/business.exception";
import { Match } from "../matches/entities/match.entity";
import { User } from "../users/entities/user.entity";
import { RecruiterProfile } from "../companies/entities/recruiter-profile.entity";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";

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

  findAll() {
    return this.conversations.find({
      order: { createdAt: "DESC" },
      relations: {
        match: { candidate: { user: true }, job: { company: true } },
        messages: true,
      },
    });
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

  async findMessages(conversationId: string) {
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

  async addMessage(conversationId: string, senderId: string, body: string) {
    const [conversation, sender] = await Promise.all([
      this.conversations.findOneByOrFail({ id: conversationId }),
      this.users.findOneByOrFail({ id: senderId }),
    ]);
    return this.messages.save(
      this.messages.create({ conversation, sender, body }),
    );
  }
}
