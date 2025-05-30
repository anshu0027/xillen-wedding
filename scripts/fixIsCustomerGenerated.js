const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config(); // Load environment variables from .env file

const prisma = new PrismaClient();

async function main() {
  // Set isCustomerGenerated = true where source == "CUSTOMER"
  const updatedCustomer = await prisma.quote.updateMany({
    where: { source: 'CUSTOMER' },
    data: { isCustomerGenerated: true },
  });

  // Set isCustomerGenerated = false where source == "ADMIN"
  const updatedAdmin = await prisma.quote.updateMany({
    where: { source: 'ADMIN' },
    data: { isCustomerGenerated: false },
  });

  console.log(`Updated ${updatedCustomer.count} customer quotes and ${updatedAdmin.count} admin quotes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
