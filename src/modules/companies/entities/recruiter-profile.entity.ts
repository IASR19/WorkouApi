import { Column, Entity, ManyToOne } from "typeorm";

import { BaseEntity } from "../../../common/entities/base.entity";
import { User } from "../../users/entities/user.entity";
import { Company } from "./company.entity";

export enum RecruiterRole {
  Owner = "owner",
  Manager = "manager",
}

@Entity("recruiter_profiles")
export class RecruiterProfile extends BaseEntity {
  @ManyToOne(() => User, { eager: true })
  user!: User;

  @ManyToOne(() => Company, { eager: true })
  company!: Company;

  @Column({
    type: "enum",
    enum: RecruiterRole,
    default: RecruiterRole.Manager,
    name: "company_role",
  })
  companyRole!: RecruiterRole;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ name: "extra_jobs_allowed", default: 0 })
  extraJobsAllowed!: number;

  @Column({ name: "jobs_posted_this_month", default: 0 })
  jobsPostedThisMonth!: number;
}
