import type { Domain } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
let db = new PrismaClient();

async function seed() {
  await Promise.all(
    getDomains().map((domain) => {
      return db.domain.create({ data: domain });
    })
  );
}

seed();

function getDomains(): Pick<Domain, "name">[] {
  return [
    {
      name: "Itscrap.com",
    },
    {
      name: "Whorepresents.com",
    },
    {
      name: "Penisland.net",
    },
  ];
}
