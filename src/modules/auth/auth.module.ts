import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { UsersModule } from "../users/users.module";
import { CandidatesModule } from "../candidates/candidates.module";
import { CompaniesModule } from "../companies/companies.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";

@Global()
@Module({
  imports: [
    PassportModule,
    UsersModule,
    CandidatesModule,
    CompaniesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<any>("JWT_ACCESS_EXPIRES_IN");
        return {
          secret: config.get<string>("JWT_SECRET", "change-me-access-secret"),
          // No expiresIn set (JWT_ACCESS_EXPIRES_IN unset) means the token
          // never expires; the session only ends on logout or cleared storage.
          signOptions: expiresIn ? { expiresIn } : {},
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtStrategy],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
