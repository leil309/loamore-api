import { Module } from '@nestjs/common';
import { ClassResolver } from 'src/class/class.resolver';
import { ClassService } from 'src/class/class.service';

@Module({
  providers: [ClassResolver, ClassService],
})
export class ClassModule {}
