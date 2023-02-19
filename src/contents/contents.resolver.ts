import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { table_name } from 'src/@generated/table-name/table-name.model';
import { ContentsService } from 'src/contents/contents.service';

@Resolver()
export class ContentsResolver {
  constructor(private readonly contentsService: ContentsService) {}

  @Query(() => table_name, {
    description: 'test',
  })
  getTestTableData() {
    return this.contentsService.getTestTableData();
  }
}
