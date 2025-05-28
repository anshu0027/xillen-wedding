import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "./prismaClient";
import { QuoteSource, PaymentStatus } from "@prisma/client";

/**
 * Generate a unique ID with the specified prefix
 * @param prefix Prefix for the ID (PCI, QAI, PAI)
 * @param length Length of the random part of the ID
 * @returns A unique ID with the specified prefix
 */
export function generateUniqueId(prefix: string, length: number = 6): string {
  const randomPart = Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
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
    include: { policy: true },
  });

  if (!quote) {
    throw new Error("Quote not found");
  }

  // If policy already exists, return it
  if (quote.policy) {
    return quote.policy;
  }

  // Determine the policy number prefix based on quote source
  const policyPrefix = quote.source === "ADMIN" ? "PAI" : "PCI";
  const policyNumber = generateUniqueId(policyPrefix);

  // Create the policy and update the quote
  const policy = await prisma.$transaction(async (prisma) => {
    // Create the policy
    const newPolicy = await prisma.policy.create({
      data: {
        policyNumber,
        quoteId: quote.id,
      },
    });

    // Mark the quote as converted to policy
    await prisma.quote.update({
      where: { id: quote.id },
      data: { convertedToPolicy: true },
    });

    return newPolicy;
  });

  return policy;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;
    const {
      step,
      quoteNumber,
      source = "CUSTOMER",
      paymentStatus,
      ...fields
    } = data;
    let quote;

    if (step === "COMPLETE") {
      if (quoteNumber) {
        // Update existing quote, retain original quoteNumber
        quote = await prisma.quote.update({
          where: { quoteNumber },
          data: {
            ...fields,
            status: step,
          },
        });
      } else {
        // Create new quote with appropriate prefix
        const prefix = source === "ADMIN" ? "QAI" : "PCI";
        const newQuoteNumber = generateUniqueId(prefix);

        quote = await prisma.quote.create({
          data: {
            ...fields,
            quoteNumber: newQuoteNumber,
            status: step,
            source: source as QuoteSource,
          },
        });
      }

      // If this is a customer quote with successful payment, convert to policy
      if (source === "CUSTOMER" && paymentStatus === "SUCCESS") {
        const policy = await convertQuoteToPolicy(quote.id);

        // Create payment record
        if (policy && fields.totalPremium) {
          await prisma.payment.create({
            data: {
              policyId: policy.id,
              amount: parseFloat(fields.totalPremium.toString()),
              status: PaymentStatus.SUCCESS,
              method: "online",
              reference: `payment-${Date.now()}`,
            },
          });
        }

        return res.status(201).json({
          quoteNumber: quote.quoteNumber,
          quote,
          policy,
          converted: true,
        });
      }
    }

    return res.status(201).json({ quoteNumber: quote.quoteNumber, quote });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save quote step" });
  }
}
