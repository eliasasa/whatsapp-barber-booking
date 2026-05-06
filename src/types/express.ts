import { AdminUser } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
    }
  }
}

export {};
