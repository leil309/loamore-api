import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { CharacterService } from './character.service';
import { character } from '../@generated/character/character.model';
import { CharacterRankOutput } from './dto/character.output';
import { FindCursorCharacterRankingArgs } from './dto/characterRanking.args';
import { ICharacter } from '../common/interface';
import { AverageEngravingOutput } from './dto/averageEngraving.output';

@Resolver()
export class CharacterResolver {
  constructor(private readonly characterService: CharacterService) {}

  @Query(() => character, {
    description: 'character 빠른 조회',
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

  @Mutation(() => character, {
    description: 'character 최신정보 조회',
  })
  async upsertCharacter(@Args('args', { type: () => String }) args: string) {
    const character: ICharacter = JSON.parse(args);
    await this.characterService.upsertCharacter(character);
    return this.characterService.findCharacter(character.userName);
  }

  @Query(() => [AverageEngravingOutput], {
    description: '평균 각인 정보 조회',
  })
  async findAverageEngraving(
    @Args('name', { type: () => String }) name: string,
  ) {
    return this.characterService.findAverageEngraving(name);
  }

  @Query(() => [AverageEngravingOutput], {
    description: '평균 보석 정보 조회',
  })
  async findAverageGem(
    @Args('name', { type: () => String }) name: string,
  ) {
    return this.characterService.findAverageGem(name);
  }
}
