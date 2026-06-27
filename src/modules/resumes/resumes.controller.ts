import { Body, Controller, Get, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

import { CreateResumeDto } from './dto/create-resume.dto';
import { ResumesService } from './resumes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/current-user.decorator';
import { CandidatesService } from '../candidates/candidates.service';

@ApiTags('resumes')
@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(
    private readonly resumesService: ResumesService,
    private readonly candidatesService: CandidatesService
  ) {}

  @Get()
  findAll() {
    return this.resumesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateResumeDto) {
    return this.resumesService.create(dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserPayload
  ) {
    const candidate = await this.candidatesService.findByUserId(user.sub);
    if (!candidate) throw new Error('Candidate profile not found');
    return this.resumesService.parseResumeFromBuffer(candidate.id, file.buffer, file.originalname);
  }
}
