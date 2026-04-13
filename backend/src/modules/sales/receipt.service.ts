import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate receipt data for printing
   */
  async generateReceipt(saleId: string, organizationId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        organizationId,
      },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        customer: true,
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
        branch: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!sale) {
      throw new BadRequestException('Sale not found');
    }

    // Format receipt data
    return {
      // Header
      businessName: sale.branch.organization.name,
      branchName: sale.branch.name,
      address: sale.branch.physicalAddress || '',
      taxPin: sale.branch.organization.taxPin || '',
      phone: sale.branch.organization.phone || '',

      // Sale Info
      receiptNumber: sale.receiptNumber,
      date: sale.createdAt,
      cashier: sale.user.fullName,

      // Customer
      customer: sale.customer
        ? {
            name: sale.customer.name,
            phone: sale.customer.phone,
            taxPin: sale.customer.taxPin,
          }
        : null,

      // Items
      items: sale.saleItems.map((item) => ({
        name: item.product?.name || item.productName,
        sku: item.product?.sku || item.productSku || '',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discountAmount),
        tax: Number(item.taxAmount),
        total: Number(item.totalAmount),
      })),

      // Totals
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discountAmount),
      tax: Number(sale.taxAmount),
      total: Number(sale.totalAmount),

      // Footer
      footerText: 'Thank you for your business!',
      website: 'www.yourbusiness.com',
    };
  }

  /**
   * Generate receipt as plain text (for thermal printers)
   */
  async generateTextReceipt(
    saleId: string,
    organizationId: string,
  ): Promise<string> {
    const receipt = await this.generateReceipt(saleId, organizationId);

    let text = '';

    // Header
    text += this.centerText(receipt.businessName, 48) + '\n';
    text += this.centerText(receipt.branchName, 48) + '\n';
    text += this.centerText(receipt.address, 48) + '\n';
    text += this.centerText(`PIN: ${receipt.taxPin}`, 48) + '\n';
    text += this.centerText(`Tel: ${receipt.phone}`, 48) + '\n';
    text += this.line(48) + '\n';

    // Receipt Info
    text += `Receipt: ${receipt.receiptNumber}\n`;
    text += `Date: ${new Date(receipt.date).toLocaleString()}\n`;
    text += `Cashier: ${receipt.cashier}\n`;

    if (receipt.customer) {
      text += `Customer: ${receipt.customer.name}\n`;
      if (receipt.customer.phone) {
        text += `Phone: ${receipt.customer.phone}\n`;
      }
    }

    text += this.line(48) + '\n';

    // Items
    text +=
      this.formatRow('Item', 'Qty', 'Price', 'Total', [20, 8, 10, 10]) + '\n';
    text += this.line(48) + '\n';

    receipt.items.forEach((item) => {
      text +=
        this.formatRow(
          item.name,
          item.quantity.toString(),
          this.formatCurrency(item.unitPrice),
          this.formatCurrency(item.total),
          [20, 8, 10, 10],
        ) + '\n';

      if (item.discount > 0) {
        text += `  Discount: -${this.formatCurrency(item.discount)}\n`;
      }
    });

    text += this.line(48) + '\n';

    // Totals
    text += this.formatTotalLine('Subtotal:', receipt.subtotal) + '\n';
    if (receipt.discount > 0) {
      text += this.formatTotalLine('Discount:', -receipt.discount) + '\n';
    }
    text += this.formatTotalLine('VAT (16%):', receipt.tax) + '\n';
    text += this.line(48) + '\n';
    text += this.formatTotalLine('TOTAL:', receipt.total, true) + '\n';
    text += this.line(48) + '\n';

    // Footer
    text += '\n';
    text += this.centerText(receipt.footerText, 48) + '\n';
    text += this.centerText(receipt.website, 48) + '\n';
    text += '\n\n\n';

    return text;
  }

  // Helper methods for formatting
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private line(width: number): string {
    return '-'.repeat(width);
  }

  private formatRow(
    col1: string,
    col2: string,
    col3: string,
    col4: string,
    widths: number[],
  ): string {
    return (
      this.padRight(col1, widths[0]) +
      this.padRight(col2, widths[1]) +
      this.padRight(col3, widths[2]) +
      this.padLeft(col4, widths[3])
    );
  }

  private formatTotalLine(
    label: string,
    amount: number,
    bold: boolean = false,
  ): string {
    const formatted = this.formatCurrency(amount);
    const padding = 48 - label.length - formatted.length;
    return label + ' '.repeat(padding) + formatted;
  }

  private padRight(text: string, width: number): string {
    return text.substring(0, width).padEnd(width, ' ');
  }

  private padLeft(text: string, width: number): string {
    return text.substring(0, width).padStart(width, ' ');
  }

  private formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }
}
