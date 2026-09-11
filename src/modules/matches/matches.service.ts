import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Candidate } from "../candidates/entities/candidate.entity";
import { Job } from "../jobs/entities/job.entity";
import { RecruiterProfile } from "../companies/entities/recruiter-profile.entity";
import { CreateMatchDto } from "./dto/create-match.dto";
import { Match, MatchDecision } from "./entities/match.entity";
import { Conversation } from "../conversations/entities/conversation.entity";

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
    @InjectRepository(RecruiterProfile)
    private readonly profiles: Repository<RecruiterProfile>,
  ) {}

  findAll() {
    return this.matches.find({
      order: { score: "DESC" },
      relations: { job: true, candidate: true },
    });
  }

  async create(dto: CreateMatchDto) {
    const [job, candidate] = await Promise.all([
      this.jobs.findOneByOrFail({ id: dto.jobId }),
      this.candidates.findOneByOrFail({ id: dto.candidateId }),
    ]);
    return this.matches.save(this.matches.create({ ...dto, job, candidate }));
  }

  async findCandidateQueue(userId: string) {
    const candidate = await this.candidates.findOneBy({ user: { id: userId } });
    if (!candidate) {
      throw new NotFoundException("Candidate profile not found for user");
    }
    return this.matches.find({
      where: {
        candidate: { id: candidate.id },
        candidateDecision: MatchDecision.Pending,
      },
      order: { score: "DESC" },
      relations: {
        job: {
          company: true,
        },
      },
    });
  }

  async findRecruiterQueue(userId: string, jobId: string) {
    // Find the job with createdBy relation
    const job = await this.jobs.findOne({
      where: { id: jobId },
      relations: { createdBy: true, company: true },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    // Find recruiter profile
    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true },
    });

    if (!profile) {
      throw new ForbiddenException("Recruiter profile not found");
    }

    // Check if user has permission to access this job
    // Owner can see all company jobs, manager can only see their own
    const isOwner = profile.companyRole === "owner";
    const isJobCreator = job.createdBy?.id === profile.id;
    const isSameCompany = job.company?.id === profile.company.id;

    if (!isSameCompany) {
      throw new ForbiddenException(
        "You do not have permission to access this job",
      );
    }

    if (!isOwner && !isJobCreator) {
      throw new ForbiddenException(
        "You can only view matches for jobs you created",
      );
    }

    return this.matches.find({
      where: {
        job: { id: jobId },
        recruiterDecision: MatchDecision.Pending,
      },
      order: { score: "DESC" },
      relations: {
        candidate: {
          user: true,
        },
      },
    });
  }

  private async checkAndCreateConversation(match: Match) {
    if (match.isMutual) {
      const existing = await this.conversations.findOneBy({
        match: { id: match.id },
      });
      if (!existing) {
        await this.conversations.save(
          this.conversations.create({
            match,
            unlocked: true,
          }),
        );
      }
    }
  }

  private async assertRecruiterOwnsJob(userId: string, jobId: string) {
    const job = await this.jobs.findOne({
      where: { id: jobId },
      relations: { createdBy: true, company: true },
    });
    if (!job) throw new NotFoundException("Job not found");

    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true },
    });
    if (!profile || profile.company.id !== job.company?.id) {
      throw new ForbiddenException("You do not have permission to access this job");
    }

    const isOwner = profile.companyRole === "owner";
    const isJobCreator = job.createdBy?.id === profile.id;
    if (!isOwner && !isJobCreator) {
      throw new ForbiddenException("You can only decide on matches for jobs you created");
    }
  }

  private async assertCandidateOwnsMatch(userId: string, candidateId: string) {
    const candidate = await this.candidates.findOne({
      where: { id: candidateId },
      relations: { user: true },
    });
    if (!candidate || candidate.user?.id !== userId) {
      throw new ForbiddenException("You can only decide on your own matches");
    }
  }

  async setRecruiterDecision(id: string, userId: string, decision: MatchDecision) {
    const match = await this.matches.findOne({
      where: { id },
      relations: { job: true, candidate: true },
    });
    if (!match) throw new NotFoundException("Match not found");
    await this.assertRecruiterOwnsJob(userId, match.job.id);

    match.recruiterDecision = decision;
    match.isMutual =
      match.recruiterDecision === MatchDecision.Approved &&
      match.candidateDecision === MatchDecision.Approved;

    const saved = await this.matches.save(match);
    await this.checkAndCreateConversation(saved);
    return saved;
  }

  async setCandidateDecision(id: string, userId: string, decision: MatchDecision) {
    const match = await this.matches.findOne({
      where: { id },
      relations: { job: true, candidate: true },
    });
    if (!match) throw new NotFoundException("Match not found");
    await this.assertCandidateOwnsMatch(userId, match.candidate.id);

    match.candidateDecision = decision;
    match.isMutual =
      match.recruiterDecision === MatchDecision.Approved &&
      match.candidateDecision === MatchDecision.Approved;

    const saved = await this.matches.save(match);
    await this.checkAndCreateConversation(saved);
    return saved;
  }

  async undoLastDecision(id: string, userId: string, role: "recruiter" | "candidate") {
    const match = await this.matches.findOne({
      where: { id },
      relations: { job: true, candidate: true },
    });
    if (!match) throw new NotFoundException("Match not found");

    if (role === "recruiter") {
      await this.assertRecruiterOwnsJob(userId, match.job.id);
      match.recruiterDecision = MatchDecision.Pending;
    } else {
      await this.assertCandidateOwnsMatch(userId, match.candidate.id);
      match.candidateDecision = MatchDecision.Pending;
    }
    match.isMutual = false;

    // Delete conversation if existed since it is no longer mutual
    const existingConv = await this.conversations.findOneBy({
      match: { id: match.id },
    });
    if (existingConv) {
      await this.conversations.delete(existingConv.id);
    }

    return this.matches.save(match);
  }
}
