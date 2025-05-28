import { PrismaClient, Prisma, QuoteSource, PaymentStatus, StepStatus } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export Prisma types for use in other files
export { QuoteSource, PaymentStatus, StepStatus };

/**
 * Generate a unique ID with the specified prefix
 * @param prefix Prefix for the ID (PCI, QAI, PAI)
 * @param length Length of the random part of the ID
 * @returns A unique ID with the specified prefix
 */
export function generateUniqueId(prefix: string, length: number = 6): string {
  const randomPart = Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
  return `${prefix}-${randomPart}`;
}

/**
 * Convert a quote to a policy
 * @param quoteId ID of the quote to convert
 * @returns The newly created policy
 */
export async function convertQuoteToPolicy(quoteId: number) {
  // Get the quote with its related data
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { policy: true }
  });

  if (!quote) {
    throw new Error("Quote not found");
  }

  // If policy already exists, return it
  if (quote.policy) {
    return quote.policy;
  }

  // Determine the policy number prefix based on quote source
  const policyPrefix = quote.source === QuoteSource.ADMIN ? 'PAI' : 'PCI';
  const policyNumber = generateUniqueId(policyPrefix);

  // Create the policy and update the quote
  const policy = await prisma.$transaction(async (tx) => {
    // Create the policy
    const newPolicy = await tx.policy.create({
      data: {
        policyNumber,
        quoteId: quote.id,
      },
    });

    // Mark the quote as converted to policy
    await tx.quote.update({
      where: { id: quote.id },
      data: { convertedToPolicy: true },
    });

    return newPolicy;
  });

  return policy;
}

/**
 * Send an email notification for a quote or policy
 * @param type 'quote' or 'policy'
 * @param id ID of the quote or policy
 * @returns Success status
 */
export async function sendEmailNotification(type: 'quote' | 'policy', id: number) {
  try {
    // In a real implementation, this would use SMTP_EMAIL and SMTP_PASS from .env
    // For now, we'll just mark the email as sent
    
    if (type === 'quote') {
      await prisma.quote.update({
        where: { id },
        data: { 
          emailSent: true,
          emailSentAt: new Date()
        }
      });
    } else {
      await prisma.policy.update({
        where: { id },
        data: { 
          emailSent: true,
          emailSentAt: new Date()
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Failed to send ${type} email:`, error);
    return { success: false, error };
  }
}
