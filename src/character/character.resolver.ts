import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { CharacterService } from 'src/character/character.service';
import { character } from 'src/@generated/character/character.model';
import { CharacterRankOutput } from 'src/character/dto/character.output';
import { FindCursorCharacterRankingArgs } from './dto/characterRanking.args';

@Resolver()
export class CharacterResolver {
  constructor(private readonly characterService: CharacterService) {}

  @Query(() => character, {
    description: 'character 조회',
  })
  findCharacter(@Args('name', { type: () => String }) name: string) {
    return this.characterService.findCharacter(name);
  }

  @Query(() => [CharacterRankOutput], {
    description: 'ranking 조회',
  })
  findCharacterRanking(@Args() args: FindCursorCharacterRankingArgs) {
    return this.characterService.findCharacterRanking(args);
  }

  @Mutation(() => Boolean, {
    description: 'character 가져오기',
  })
  upsert(@Args('name', { type: () => String }) name: string) {
    return this.characterService.upsert(name);
  }
}
