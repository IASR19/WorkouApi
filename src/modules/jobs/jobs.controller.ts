import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { JobsService } from "./jobs.service";
import { JobStatus } from "./entities/job.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

@ApiTags("jobs")
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() pagination: PaginationQueryDto, @Request() req: any) {
    const userId = req.user?.sub;
    return this.jobsService.findAll(userId, pagination);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.jobsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateJobDto, @Request() req: any) {
    return this.jobsService.create(dto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateJobDto, @Request() req: any) {
    return this.jobsService.update(id, req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/status")
  setStatus(@Param("id") id: string, @Body() body: { status: JobStatus }, @Request() req: any) {
    return this.jobsService.setStatus(id, req.user.sub, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: any) {
    return this.jobsService.remove(id, req.user.sub);
  }
}
