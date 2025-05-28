// Modular email templates for quote and policy

interface EmailTemplateParams {
  quoteNumber: string;
  firstName: string;
  totalPremium: number;
}

export function quoteEmailTemplate({ quoteNumber, firstName, totalPremium }: EmailTemplateParams) {
  return {
    subject: `Your Wedding Insurance Quote #${quoteNumber}`,
    text: `Dear ${firstName},\n\nHere is your quote summary.\nQuote Number: ${quoteNumber}\nTotal Premium: $${totalPremium}\n\nThank you for choosing us!`,
    html: `<p>Dear ${firstName},</p><p>Here is your quote summary.</p><ul><li>Quote Number: <b>${quoteNumber}</b></li><li>Total Premium: <b>$${totalPremium}</b></li></ul><p>Thank you for choosing us!</p>`,
  };
}

export function policyEmailTemplate({ quoteNumber, firstName, totalPremium }: EmailTemplateParams) {
  return {
    subject: `Your Wedding Insurance Policy #${quoteNumber}`,
    text: `Dear ${firstName},\n\nHere is your policy summary.\nPolicy Number: ${quoteNumber}\nTotal Premium: $${totalPremium}\n\nThank you for choosing us!`,
    html: `<p>Dear ${firstName},</p><p>Here is your policy summary.</p><ul><li>Policy Number: <b>${quoteNumber}</b></li><li>Total Premium: <b>$${totalPremium}</b></li></ul><p>Thank you for choosing us!</p>`,
  };
}
