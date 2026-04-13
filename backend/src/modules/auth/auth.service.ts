import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validate user credentials
   */
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        organization: true,
        branch: true,
      },
    });

    if (!user) {
      return null;
    }

    // Check if user is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new UnauthorizedException(
        `Account locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.handleFailedLogin(user.id);
      return null;
    }

    // Reset failed login attempts on successful login
    await this.resetFailedLoginAttempts(user.id);

    // Check if user and organization are active
    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    if (user.organization.status !== 'active') {
      throw new UnauthorizedException('Organization is not active');
    }

    const { passwordHash, pinHash, ...result } = user;
    return result;
  }

  /**
   * Validate user PIN (for quick terminal login)
   */
  async validateUserPin(username: string, pin: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        organization: true,
        branch: true,
      },
    });

    if (!user || !user.pinHash) {
      return null;
    }

    // Check if user is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new UnauthorizedException(
        `Account locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, user.pinHash);

    if (!isPinValid) {
      await this.handleFailedLogin(user.id);
      return null;
    }

    await this.resetFailedLoginAttempts(user.id);

    if (user.status !== 'active' || user.organization.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const { passwordHash, pinHash, ...result } = user;
    return result;
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    const attempts = (user?.failedLoginAttempts || 0) + 1;
    const maxAttempts = 5;

    const updateData: any = {
      failedLoginAttempts: attempts,
    };

    // Lock account after max attempts
    if (attempts >= maxAttempts) {
      const lockDuration = 30 * 60 * 1000; // 30 minutes
      updateData.lockedUntil = new Date(Date.now() + lockDuration);
      this.logger.warn(`User ${userId} locked due to failed login attempts`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedLoginAttempts(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Generate JWT tokens
   */
  async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId,
      branchId: user.branchId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1d',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(user: any, ipAddress: string, deviceInfo?: any) {
    // Generate tokens
    const tokens = await this.generateTokens(user);

    await this.createSession(user.id, tokens.refreshToken, ipAddress, deviceInfo);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    if (deviceInfo) {
      this.logger.debug(
        `Device info received for ${user.username}: ${JSON.stringify(deviceInfo)}`,
      );
    }

    this.logger.log(`User ${user.username} logged in from ${ipAddress}`);

    // Gap 3 — A1: Upsert capability snapshot for offline auth
    const snapshotValidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const permissions = Array.isArray(user.permissions)
      ? user.permissions
      : Object.keys(user.permissions || {});
    await this.prisma.capabilitySnapshot.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        role: user.role,
        permissions,
        validUntil: snapshotValidUntil,
        revoked: false,
      },
      update: {
        role: user.role,
        permissions,
        validUntil: snapshotValidUntil,
        revoked: false,
        updatedAt: new Date(),
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        branchId: user.branchId,
        organization: user.organization,
        branch: user.branch,
      },
      capabilitySnapshot: {
        userId: user.id,
        role: user.role,
        permissions,
        validUntil: snapshotValidUntil.toISOString(),
        revoked: false,
      },
    };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    ipAddress: string,
    deviceInfo?: any,
  ) {
    await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
        ipAddress,
        deviceInfo: deviceInfo || {},
        expiresAt: this.getRefreshTokenExpiryDate(),
      },
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    const userId = payload.sub;

    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        isValid: true,
        expiresAt: { gt: new Date() },
      },
    });

    let validSessionId: string | null = null;
    for (const session of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (isMatch) {
        validSessionId = session.id;
        break;
      }
    }

    if (!validSessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        branch: true,
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    await this.prisma.userSession.update({
      where: { id: validSessionId },
      data: {
        refreshTokenHash: await bcrypt.hash(tokens.refreshToken, 10),
        lastActivityAt: new Date(),
        expiresAt: this.getRefreshTokenExpiryDate(),
      },
    });

    return tokens;
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!user || user.status !== 'active' || !user.email) {
      return {
        message:
          'If that account exists, a password reset link or code has been issued.',
      };
    }

    const resetToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        purpose: 'password-reset',
      },
      {
        secret:
          this.configService.get<string>('RESET_PASSWORD_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
        expiresIn:
          this.configService.get<string>('RESET_PASSWORD_EXPIRES_IN') || '15m',
      },
    );

    this.logger.log(`Password reset requested for ${user.email}`);

    const response: { message: string; resetToken?: string } = {
      message:
        'If that account exists, a password reset link or code has been issued.',
    };

    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      response.resetToken = resetToken;
    }

    return response;
  }

  async confirmPasswordReset(resetToken: string, newPassword: string) {
    const payload = await this.jwtService.verifyAsync(resetToken, {
      secret:
        this.configService.get<string>('RESET_PASSWORD_SECRET') ||
        this.configService.get<string>('JWT_SECRET'),
    });

    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Invalid password reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        forcePasswordChange: false,
      },
    });

    await this.prisma.userSession.updateMany({
      where: {
        userId: user.id,
        isValid: true,
      },
      data: {
        isValid: false,
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`Password reset completed for user ${user.id}`);

    return {
      message: 'Password reset successful.',
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const sessions = await this.prisma.userSession.findMany({
        where: {
          userId,
          isValid: true,
        },
      });

      for (const session of sessions) {
        const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
        if (isMatch) {
          await this.prisma.userSession.update({
            where: { id: session.id },
            data: {
              isValid: false,
              lastActivityAt: new Date(),
            },
          });
          this.logger.log(`User ${userId} logged out`);
          return;
        }
      }

      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.userSession.updateMany({
      where: {
        userId,
        isValid: true,
      },
      data: {
        isValid: false,
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`User ${userId} logged out`);
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
        forcePasswordChange: false,
      },
    });

    await this.prisma.userSession.updateMany({
      where: {
        userId,
        isValid: true,
      },
      data: {
        isValid: false,
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`User ${userId} changed password`);
  }

  /**
   * Validate session
   */
  async validateSession(userId: string, refreshToken: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const sessions = await this.prisma.userSession.findMany({
        where: {
          userId,
          isValid: true,
          expiresAt: { gt: new Date() },
        },
      });

      for (const session of sessions) {
        const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
        if (isMatch) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  async getCapabilitySnapshot(userId: string) {
    return this.prisma.capabilitySnapshot.findUnique({ where: { userId } });
  }

  // Gap 3 — A1: Revoke capability snapshot so device clears session on next sync
  async revokeCapabilitySnapshot(userId: string): Promise<void> {
    await this.prisma.capabilitySnapshot.upsert({
      where: { userId },
      create: { userId, role: 'none', permissions: [], validUntil: new Date(), revoked: true },
      update: { revoked: true, updatedAt: new Date() },
    });
    // Also invalidate all sessions
    await this.prisma.userSession.updateMany({
      where: { userId, isValid: true },
      data: { isValid: false },
    });
    this.logger.warn(`Capability snapshot revoked for user ${userId}`);
  }

  private getRefreshTokenExpiryDate() {
    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const now = new Date();
    const match = /^(\d+)([dhm])$/i.exec(expiresIn);

    if (!match) {
      now.setDate(now.getDate() + 7);
      return now;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === 'd') {
      now.setDate(now.getDate() + value);
    } else if (unit === 'h') {
      now.setHours(now.getHours() + value);
    } else {
      now.setMinutes(now.getMinutes() + value);
    }

    return now;
  }
}
