import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Groq from 'groq-sdk';

import { Candidate } from '../candidates/entities/candidate.entity';
import { CreateResumeDto } from './dto/create-resume.dto';
import { Resume, ResumeStatus } from './entities/resume.entity';
import { Job } from '../jobs/entities/job.entity';
import { Match, MatchDecision } from '../matches/entities/match.entity';

const EXTRACT_PROMPT = (text: string) => `
Você é um extrator de currículos. Analise o currículo abaixo e retorne SOMENTE um objeto JSON válido, sem markdown, sem blocos de código, sem texto adicional.

Formato obrigatório:
{
  "headline": "título/cargo profissional principal",
  "location": "cidade, estado ou país",
  "workModel": "Remote" | "Hybrid" | "Onsite",
  "yearsExperience": <número inteiro - some os anos de todas as experiências>,
  "desiredSalary": <número ou null>,
  "skills": ["skill1", "skill2", ...],
  "links": ["url_ou_contato1", ...],
  "experience": [
    { "role": "", "company": "", "startDate": "", "endDate": "", "description": "" }
  ],
  "education": [
    { "degree": "", "institution": "", "startYear": "", "endYear": "" }
  ],
  "courses": [
    { "name": "", "institution": "", "year": "" }
  ]
}

Regras:
- yearsExperience: some os anos de todas as experiências profissionais relevantes
- workModel: infira pelo histórico (Remote, Hybrid ou Onsite)
- desiredSalary: null se não houver informação
- skills: liste TODAS as tecnologias, linguagens, frameworks e ferramentas mencionadas
- Retorne SOMENTE o JSON, nada mais

Currículo:
${text.substring(0, 12000)}
`.trim();

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);
  private groq: Groq;

  constructor(
    @InjectRepository(Resume) private readonly resumes: Repository<Resume>,
    @InjectRepository(Candidate) private readonly candidates: Repository<Candidate>,
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    private readonly config: ConfigService
  ) {
    const key = this.config.get<string>('GROQ_API_KEY');
    if (!key) {
      throw new InternalServerErrorException(
        'GROQ_API_KEY não configurada. Obtenha grátis em console.groq.com, adicione ao .env e reinicie o servidor.'
      );
    }
    this.groq = new Groq({ apiKey: key });
  }

  findAll() {
    return this.resumes.find({ order: { createdAt: 'DESC' }, relations: { candidate: true } });
  }

  async create(dto: CreateResumeDto) {
    const candidate = await this.candidates.findOneByOrFail({ id: dto.candidateId });
    return this.resumes.save(
      this.resumes.create({
        candidate,
        fileName: dto.fileName,
        storageUrl: dto.storageUrl,
        parsedSummary: dto.parsedSummary,
        status: dto.parsedSummary ? ResumeStatus.Parsed : ResumeStatus.Uploaded
      })
    );
  }

  private static readonly MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b'];

  private isModelUnavailableError(err: any): boolean {
    const code = err?.error?.code ?? err?.code;
    return err?.status === 404 || code === 'model_not_found' || code === 'model_decommissioned';
  }

  private async extractWithAI(text: string): Promise<Record<string, any>> {
    let raw = '';
    let lastError: any;

    for (const [index, model] of ResumesService.MODELS.entries()) {
      try {
        const completion = await this.groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: EXTRACT_PROMPT(text)
            }
          ],
          temperature: 0.1,
          max_tokens: 4096,
          response_format: { type: 'json_object' }
        });
        raw = completion.choices[0]?.message?.content ?? '';
        if (index > 0) {
          this.logger.warn(`Modelo principal indisponível, resposta obtida via fallback "${model}".`);
        }
        lastError = undefined;
        break;
      } catch (err: any) {
        lastError = err;
        if (!this.isModelUnavailableError(err)) {
          break;
        }
      }
    }

    if (lastError) {
      throw new InternalServerErrorException(
        `Falha na chamada ao Groq (modelos tentados: ${ResumesService.MODELS.join(', ')}): ${lastError?.message ?? 'erro desconhecido'}`
      );
    }

    if (!raw.trim()) {
      throw new InternalServerErrorException('Groq retornou resposta vazia.');
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw.trim();

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new InternalServerErrorException(
        `Resposta inválida (não é JSON): ${raw.substring(0, 300)}`
      );
    }

    return parsed;
  }

  async parseResumeFromBuffer(candidateId: string, buffer: Buffer, fileName: string) {
    const candidate = await this.candidates.findOne({ where: { id: candidateId }, relations: { user: true } });
    if (!candidate) throw new BadRequestException('Candidato não encontrado');

    let pdfText: string;
    try {
      const pdfParseRaw = require('pdf-parse');
      const pdfParseFn: (buf: Buffer) => Promise<{ text: string }> =
        typeof pdfParseRaw === 'function' ? pdfParseRaw : pdfParseRaw.default ?? pdfParseRaw;
      const pdfData = await pdfParseFn(buffer);
      pdfText = pdfData.text;
    } catch (err: any) {
      throw new BadRequestException(
        `Não foi possível ler o PDF: ${err?.message ?? 'erro desconhecido'}. Verifique se o arquivo não está corrompido.`
      );
    }

    if (!pdfText || pdfText.trim().length < 50) {
      throw new BadRequestException(
        'O PDF não contém texto suficiente para análise. Verifique se o arquivo não é uma imagem escaneada.'
      );
    }

    const parsedData = await this.extractWithAI(pdfText);
    await this.updateCandidateAndMatches(candidate, parsedData, fileName);

    const updated = await this.candidates.findOne({ where: { id: candidateId }, relations: { user: true } });
    return { candidate: updated, parsedData };
  }

  private async updateCandidateAndMatches(candidate: Candidate, parsedData: Record<string, any>, fileName: string) {
    candidate.headline = parsedData.headline ?? candidate.headline;
    candidate.location = parsedData.location ?? candidate.location;
    candidate.workModel = parsedData.workModel ?? candidate.workModel;
    candidate.yearsExperience = parsedData.yearsExperience ?? candidate.yearsExperience;
    candidate.skills = parsedData.skills ?? candidate.skills;
    candidate.links = parsedData.links ?? candidate.links;
    candidate.desiredSalary = parsedData.desiredSalary ?? candidate.desiredSalary;
    candidate.parsedPayload = parsedData;
    await this.candidates.save(candidate);

    await this.matches.delete({ candidate: { id: candidate.id }, candidateDecision: MatchDecision.Pending });

    const activeJobs = await this.jobs.find({ relations: { company: true } });
    for (const job of activeJobs) {
      const candidateSkills = candidate.skills || [];
      const required = job.requiredSkills || [];
      let skillScore = 0;
      if (required.length > 0) {
        const matched = required.filter(s =>
          candidateSkills.some(cs =>
            cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase())
          )
        );
        skillScore = Math.round((matched.length / required.length) * 70);
      } else {
        skillScore = 70;
      }

      let workModelScore = 0;
      if (candidate.workModel && job.workModel) {
        const cModel = candidate.workModel.toLowerCase();
        const jModel = job.workModel.toLowerCase();
        workModelScore = (cModel === jModel) ? 15 : (cModel === 'remote' || jModel === 'remote') ? 10 : 5;
      } else {
        workModelScore = 15;
      }

      let salaryScore = 15;
      if (candidate.desiredSalary && job.salaryMax && candidate.desiredSalary > job.salaryMax) {
        const over = candidate.desiredSalary - job.salaryMax;
        salaryScore = Math.max(0, 15 - Math.round((over / job.salaryMax) * 15));
      }

      const totalScore = skillScore + workModelScore + salaryScore;
      if (totalScore >= 45) {
        let scoreReason = 'Alinhamento parcial na stack e discrepâncias em preferências.';
        if (totalScore >= 85) scoreReason = 'Excelente alinhamento tecnológico, modelo de trabalho e salário compatível.';
        else if (totalScore >= 70) scoreReason = 'Ótimo alinhamento com pequenos desvios em modelo de trabalho ou salário.';
        else if (totalScore >= 50) scoreReason = 'Compatibilidade mediana, necessita avaliação detalhada.';

        await this.matches.save(this.matches.create({
          job, candidate, score: totalScore, scoreReason,
          recruiterDecision: MatchDecision.Pending, candidateDecision: MatchDecision.Pending
        }));
      }
    }

    await this.resumes.save(this.resumes.create({
      candidate,
      fileName,
      storageUrl: `http://localhost:3001/uploads/${fileName}`,
      parsedSummary: `${parsedData.headline} — ${parsedData.yearsExperience} anos de experiência`,
      parsedPayload: parsedData,
      status: ResumeStatus.Parsed
    }));
  }
}
