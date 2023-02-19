import { Module } from '@nestjs/common';
import { ContentsService } from 'src/contents/contents.service';
import { ContentsResolver } from 'src/contents/contents.resolver';

@Module({
  providers: [ContentsResolver, ContentsService],
})
export class ContentsModule {}
