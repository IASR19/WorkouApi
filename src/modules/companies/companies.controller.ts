import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanType } from "./entities/company.entity";
import { CompaniesService } from "./companies.service";
import { CompanyOwnerGuard } from "./guards/company-owner.guard";

@ApiTags("companies")
@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMyCompany(@Request() req: any) {
    return this.companiesService.getMyCompany(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Patch("me")
  updateMyCompany(
    @Request() req: any,
    @Body() body: { name?: string; website?: string; industry?: string; logo?: string },
  ) {
    return this.companiesService.updateMyCompany(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me/profile")
  getMyProfile(@Request() req: any) {
    return this.companiesService.getMyProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me/seats")
  getSeats(@Request() req: any) {
    return this.companiesService.getSeats(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Post("me/seats")
  addSeat(
    @Request() req: any,
    @Body()
    body: { name: string; email: string; password: string; cardLast4?: string },
  ) {
    return this.companiesService.addSeat(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Delete("me/seats/:profileId")
  removeSeat(@Request() req: any, @Param("profileId") profileId: string) {
    return this.companiesService.removeSeat(req.user.sub, profileId);
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Post("me/subscribe")
  subscribe(
    @Request() req: any,
    @Body()
    body: {
      plan: PlanType;
      cardNumber: string;
      cardName: string;
      cardExpiry: string;
      cardCvv: string;
    },
  ) {
    return this.companiesService.subscribeToPlan(req.user.sub, body.plan, body);
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Post("me/seats/:profileId/extra-job")
  buyExtraJob(
    @Request() req: any,
    @Param("profileId") profileId: string,
    @Body() body: { cardLast4?: string },
  ) {
    return this.companiesService.buyExtraJob(req.user.sub, profileId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me/billing")
  getBilling(@Request() req: any) {
    return this.companiesService.getBillingRecords(req.user.sub);
  }
}
