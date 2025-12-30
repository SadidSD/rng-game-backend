import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../dto/auth.dto';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();

        // If no user attached (e.g. public route or auth failed), deny
        if (!user) return false;

        // Admin/Owner usually has access to everything, but let's be strict for now
        // Example: If user.role is ADMIN, and required is STAFF, ADMIN should pass?
        // For now, strict match or hierarchy. Let's do exact array inclusion.
        return requiredRoles.some((role) => user.role === role);
    }
}
