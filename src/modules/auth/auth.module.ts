import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { CompaniesModule } from '../companies/companies.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
  imports: [
    UsersModule,
    CandidatesModule,
    CompaniesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me-access-secret'),
        signOptions: {
          expiresIn: config.get<any>('JWT_ACCESS_EXPIRES_IN', '15m')
        }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard]
})
export class AuthModule {}
