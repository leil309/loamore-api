import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { CharacterService } from 'src/character/character.service';
import { character } from 'src/@generated/character/character.model';
import { CharacterRankOutput } from 'src/character/dto/character.output';
import { FindCursorCharacterRankingArgs } from './dto/characterRanking.args';
import { CompareEngravingOutput } from './dto/compareEngraving.output';
import {CharacterArgs} from "./dto/character.args";

@Resolver()
export class CharacterResolver {
  constructor(private readonly characterService: CharacterService) {}

  @Query(() => character, {
    description: 'character 빠른 조회',
  })
  findCharacter(@Args('name', { type: () => String }) args: string) {
    const character = JSON.parse(args)
    return this.characterService.findCharacter(character.userName);
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
  async upsertCharacter(@Args() args: CharacterArgs) {
    await this.characterService.upsertCharacter(args.userName);
    return this.characterService.findCharacter(args.userName);
  }

  @Query(() => [CompareEngravingOutput], {
    description: 'character 분석 정보 조회',
  })
  async analyzeCharacter(@Args('name', { type: () => String }) name: string) {
    return this.characterService.analyzeCharacter(name);
  }
}
