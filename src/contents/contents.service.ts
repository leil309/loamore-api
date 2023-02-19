import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ContentsService {
  constructor(private prisma: PrismaService) {}

  async getTestTableData() {
    return await this.prisma.table_name.findFirst({});
  }
}
