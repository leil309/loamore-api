import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { CharacterService } from './character.service';
import { character } from '../@generated/character/character.model';
import { CharacterRankOutput } from './dto/characterRanking.output';
import { FindCursorCharacterRankingArgs } from './dto/characterRanking.args';
import { ICharacter } from '../common/interface';
import { AverageEngravingOutput } from './dto/averageEngraving.output';
import { AverageStatsOutput } from './dto/averageStats.output';
import { CharacterOutput } from './dto/character.output';

@Resolver()
export class CharacterResolver {
  constructor(private readonly characterService: CharacterService) {}

  @Query(() => CharacterOutput, {
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

  @Mutation(() => CharacterOutput, {
    description: 'character 최신정보 조회',
  })
  async upsertCharacter(@Args('args', { type: () => String }) args: string) {
    const character: ICharacter = JSON.parse(args);
    await this.characterService.upsertCharacter(character);
    return await this.characterService.findCharacter(character.userName);
  }

  @Query(() => [AverageEngravingOutput], {
    description: '평균 각인 정보 조회',
  })
  async findAverageEngraving(
    @Args('name', { type: () => String }) name: string,
  ) {
    return this.characterService.findAverageEngraving(name);
  }

  @Query(() => [AverageStatsOutput], {
    description: '평균 스탯 정보 조회',
  })
  async findAverageStats(@Args('name', { type: () => String }) name: string) {
    return this.characterService.findAverageStats(name);
  }

  @Query(() => [AverageEngravingOutput], {
    description: '캐릭터 강제 업뎃',
  })
  async updateForceCharacter(
    @Args('name', { type: () => String }) name: string,
  ) {
    return this.characterService.upsertJs(name);
  }

  @Query(() => Number, {
    description: '평균 무기품질 조회',
  })
  async findAverageWeapon(@Args('name', { type: () => String }) name: string) {
    return this.characterService.findAverageWeapon(name);
  }
}
