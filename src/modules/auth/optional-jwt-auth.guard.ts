import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(_err: any, user: any) {
    // Return user if exists, otherwise return null (don't throw)
    return user || null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to authenticate, but don't fail if it doesn't work
      const result = await super.canActivate(context);
      return result as boolean;
    } catch {
      // Ignore authentication errors - just continue without user
      return true;
    }
  }
}
