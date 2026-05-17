import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getPrismaForUser(userId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, args, query, model }) {
          if (["Invoice", "Project", "Client", "BankTransaction"].includes(model as string)) {
            // @ts-ignore
            args.where = { ...(args.where || {}), ownerId: userId };
          }
          console.log(`[Operation: ${operation}] on ${model}. args: ${JSON.stringify(args)}`);
          
          if (model === "Invoice") {
             if ((args as any).where?.id) {
               return [{ id: (args as any).where.id, number: "MOCK-1", amount: 1200 }];
             }
           }
          
          try {
            return await query(args);
          } catch(e: any) {
            console.log(`Prisma Error on ${operation}: ${e.message.split('\n')[0]}`);
            return null;
          }
        },
      },
    },
  }) as unknown as PrismaClient;
}

async function run() {
  const userPrisma = getPrismaForUser("user_123");
  
  console.log("--- Testing findUnique ---");
  await userPrisma.invoice.findUnique({ where: { id: "INV-1" } });

  console.log("\n--- Testing create (Data Leak 1) ---");
  // A user can create an invoice that belongs to someone else because 'data' is not protected!
  await userPrisma.invoice.create({ 
    data: { 
      number: "INV-CREATE", 
      amount: 100, 
      dueDate: new Date(), 
      clientId: "client_1", 
      ownerId: "hacked_owner", // We can inject another user's ID
    } 
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
