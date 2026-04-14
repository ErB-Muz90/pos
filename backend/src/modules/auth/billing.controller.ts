import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// Tier → limits map. Extend as you add plans.
const PLAN_LIMITS: Record<string, { maxUsers: number; maxBranches: number }> = {
  starter:      { maxUsers: 5,   maxBranches: 1 },
  professional: { maxUsers: 20,  maxBranches: 3 },
  enterprise:   { maxUsers: 100, maxBranches: 10 },
};

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Flutterwave webhook — called on successful charge.
   * Set FLUTTERWAVE_SECRET_HASH in .env to the hash from your FLW dashboard.
   *
   * Expected body shape (Flutterwave standard):
   * { event: 'charge.completed', data: { status, meta: { organizationId, plan, months } } }
   */
  @Public()
  @Post('webhook/flutterwave')
  @ApiOperation({ summary: 'Flutterwave payment webhook' })
  async flutterwaveWebhook(
    @Body() payload: any,
    @Headers('verif-hash') verifHash: string,
  ) {
    const secret = this.config.get<string>('FLUTTERWAVE_SECRET_HASH');
    if (secret && verifHash !== secret) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    if (payload?.event !== 'charge.completed' || payload?.data?.status !== 'successful') {
      return { received: true }; // ignore non-payment events
    }

    const { organizationId, plan, months = 1 } = payload.data?.meta ?? {};
    if (!organizationId || !plan) {
      this.logger.warn('Webhook missing organizationId or plan in meta', payload);
      return { received: true };
    }

    await this.activateSubscription(organizationId, plan, Number(months));
    return { received: true };
  }

  /**
   * Stripe webhook — called on invoice.paid.
   * Set STRIPE_WEBHOOK_SECRET in .env.
   *
   * Expected metadata on Stripe subscription: { organizationId, plan }
   */
  @Public()
  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe payment webhook' })
  async stripeWebhook(
    @Body() rawBody: any,
    @Headers('stripe-signature') sig: string,
  ) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (secret && sig) {
      // Minimal signature check — replace with stripe.webhooks.constructEvent() if using stripe SDK
      const hmac = crypto.createHmac('sha256', secret).update(JSON.stringify(rawBody)).digest('hex');
      if (!sig.includes(hmac)) {
        throw new UnauthorizedException('Invalid Stripe signature');
      }
    }

    if (rawBody?.type !== 'invoice.paid') {
      return { received: true };
    }

    const meta = rawBody?.data?.object?.subscription_details?.metadata ?? {};
    const { organizationId, plan, months = 1 } = meta;
    if (!organizationId || !plan) {
      this.logger.warn('Stripe webhook missing organizationId or plan in metadata');
      return { received: true };
    }

    await this.activateSubscription(organizationId, plan, Number(months));
    return { received: true };
  }

  private async activateSubscription(orgId: string, plan: string, months: number) {
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS['starter'];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionTier: plan,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresAt,
        maxUsers: limits.maxUsers,
        maxBranches: limits.maxBranches,
      },
    });

    this.logger.log(`Subscription activated: org=${orgId} plan=${plan} expires=${expiresAt.toISOString()}`);
  }
}
