import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

export interface JwtPayload {
  sub: string; // User ID
  username: string;
  role: string;
  organizationId?: string | null;
  branchId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Fetch user from database to ensure they still exist and are active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            status: true,
            subscriptionStatus: true,
            subscriptionExpiresAt: true,
            deletedAt: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    // Super admins are not scoped to any org — skip all org/subscription checks
    if (user.role !== 'superadmin') {
      if (!user.organization) {
        throw new UnauthorizedException('Organization not found');
      }

      if (user.organization.status !== 'active') {
        throw new UnauthorizedException('Organization is not active');
      }

      if (user.organization.deletedAt) {
        throw new UnauthorizedException('Organization is not active');
      }

      if (
        user.organization.subscriptionStatus !== 'active' &&
        user.organization.subscriptionStatus !== 'trial'
      ) {
        throw new UnauthorizedException('Subscription expired');
      }

      if (
        user.organization.subscriptionExpiresAt &&
        new Date(user.organization.subscriptionExpiresAt) < new Date()
      ) {
        throw new UnauthorizedException('Subscription expired');
      }
    }

    // Check if user is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new UnauthorizedException(
        `Account locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    // Invalidate previously issued access tokens after a password change.
    // JWT iat is in seconds; passwordChangedAt is a Date.
    if (payload.iat && user.passwordChangedAt) {
      const passwordChangedAtSeconds = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
      if (payload.iat < passwordChangedAtSeconds) {
        throw new UnauthorizedException('Session expired after password change');
      }
    }

    // Return user object that will be attached to request
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      branchId: user.branchId,
      permissions: user.permissions as Record<string, any>,
      organization: user.organization,
      branch: user.branch,
    };
  }
}
