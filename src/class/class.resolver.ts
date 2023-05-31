import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { ClassService } from './class.service';
import { classJob } from '../@generated/class-job/class-job.model';

@Resolver()
export class ClassResolver {
  constructor(private readonly classService: ClassService) {}

  @Mutation(() => [classJob], {
    description: 'class 추출',
  })
  upsertClass() {
    return this.classService.upsertClass();
  }

  @Query(() => [classJob], {
    description: 'class 목록 조회',
  })
  findClass() {
    return this.classService.findClass();
  }
}
