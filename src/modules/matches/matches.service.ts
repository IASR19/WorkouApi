import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Candidate } from '../candidates/entities/candidate.entity';
import { Job } from '../jobs/entities/job.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { Match, MatchDecision } from './entities/match.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    @InjectRepository(Candidate) private readonly candidates: Repository<Candidate>,
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>
  ) {}

  findAll() {
    return this.matches.find({
      order: { score: 'DESC' },
      relations: { job: true, candidate: true }
    });
  }

  async create(dto: CreateMatchDto) {
    const [job, candidate] = await Promise.all([
      this.jobs.findOneByOrFail({ id: dto.jobId }),
      this.candidates.findOneByOrFail({ id: dto.candidateId })
    ]);
    return this.matches.save(this.matches.create({ ...dto, job, candidate }));
  }

  async findCandidateQueue(userId: string) {
    const candidate = await this.candidates.findOneBy({ user: { id: userId } });
    if (!candidate) {
      throw new NotFoundException('Candidate profile not found for user');
    }
    return this.matches.find({
      where: {
        candidate: { id: candidate.id },
        candidateDecision: MatchDecision.Pending
      },
      order: { score: 'DESC' },
      relations: {
        job: {
          company: true
        }
      }
    });
  }

  async findRecruiterQueue(userId: string, jobId: string) {
    return this.matches.find({
      where: {
        job: { id: jobId },
        recruiterDecision: MatchDecision.Pending
      },
      order: { score: 'DESC' },
      relations: {
        candidate: {
          user: true
        }
      }
    });
  }

  private async checkAndCreateConversation(match: Match) {
    if (match.isMutual) {
      const existing = await this.conversations.findOneBy({ match: { id: match.id } });
      if (!existing) {
        await this.conversations.save(
          this.conversations.create({
            match,
            unlocked: true
          })
        );
      }
    }
  }

  async setRecruiterDecision(id: string, decision: MatchDecision) {
    const match = await this.matches.findOne({
      where: { id },
      relations: { job: true, candidate: true }
    });
    if (!match) throw new NotFoundException('Match not found');
    
    match.recruiterDecision = decision;
    match.isMutual =
      match.recruiterDecision === MatchDecision.Approved &&
      match.candidateDecision === MatchDecision.Approved;
    
    const saved = await this.matches.save(match);
    await this.checkAndCreateConversation(saved);
    return saved;
  }

  async setCandidateDecision(id: string, decision: MatchDecision) {
    const match = await this.matches.findOne({
      where: { id },
      relations: { job: true, candidate: true }
    });
    if (!match) throw new NotFoundException('Match not found');

    match.candidateDecision = decision;
    match.isMutual =
      match.recruiterDecision === MatchDecision.Approved &&
      match.candidateDecision === MatchDecision.Approved;

    const saved = await this.matches.save(match);
    await this.checkAndCreateConversation(saved);
    return saved;
  }

  async undoLastDecision(id: string, role: 'recruiter' | 'candidate') {
    const match = await this.matches.findOne({
      where: { id },
      relations: { job: true, candidate: true }
    });
    if (!match) throw new NotFoundException('Match not found');

    if (role === 'recruiter') {
      match.recruiterDecision = MatchDecision.Pending;
    } else {
      match.candidateDecision = MatchDecision.Pending;
    }
    match.isMutual = false;

    // Delete conversation if existed since it is no longer mutual
    const existingConv = await this.conversations.findOneBy({ match: { id: match.id } });
    if (existingConv) {
      await this.conversations.delete(existingConv.id);
    }

    return this.matches.save(match);
  }
}

