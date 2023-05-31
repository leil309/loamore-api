import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SortOrder } from '../@generated/prisma/sort-order.enum';

@Injectable()
export class ClassService {
  constructor(private prisma: PrismaService) {}

  async upsertClass() {
    const classList = await this.prisma.character.groupBy({
      by: ['class'],
    });

    return classList.map(
      async (x) =>
        await this.prisma.classJob.upsert({
          where: {
            name: x.class,
          },
          update: {},
          create: {
            name: x.class,
            image_uri: '',
          },
        }),
    );
  }

  async findClass() {
    return await this.prisma.classJob.findMany({
      include: {
        engraving: true,
      },
      orderBy: [{ type: SortOrder.desc }, { name: SortOrder.asc }],
    });
  }
}
