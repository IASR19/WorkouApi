import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CreateJobDto } from "./dto/create-job.dto";
import { JobsService } from "./jobs.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";

@ApiTags("jobs")
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Request() req: any) {
    const userId = req.user?.sub;
    return this.jobsService.findAll(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateJobDto, @Request() req: any) {
    return this.jobsService.create(dto, req.user.sub);
  }
}
