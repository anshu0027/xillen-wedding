/**
 * Generates a unique quote number in the format: XX-YYYYMMDD-NN
 * where XX is the state code, YYYYMMDD is the date, and NN is a sequence number
 */
export async function generateQuoteNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const stateCode = "WI"; // Default state code

  // Format: WI-20240214-01
  const baseNumber = `${stateCode}-${year}${month}${day}`;

  // Add a random 2-digit number (01-99)
  const randomNum = Math.floor(Math.random() * 99) + 1;
  const sequence = String(randomNum).padStart(2, "0");

  return `${baseNumber}-${sequence}`;
}
