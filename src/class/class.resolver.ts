import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ClassService } from 'src/class/class.service';
import { classJob } from 'src/@generated/class-job/class-job.model';
import { character } from 'src/@generated/character/character.model';
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
