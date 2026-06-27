import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }
}

