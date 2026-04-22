import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

export const productRepository = {
  findProductByID(productId: number) {
    return prisma.product.findUnique({
      where: { id: productId },
    });
  },
};
