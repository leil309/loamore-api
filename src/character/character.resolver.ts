import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { CharacterService } from 'src/character/character.service';
import { character } from 'src/@generated/character/character.model';

@Resolver()
export class CharacterResolver {
  constructor(private readonly characterService: CharacterService) {}

  @Query(() => character, {
    description: 'character 조회',
  })
  findCharacter(@Args('name', { type: () => String }) name: string) {
    return this.characterService.findCharacter(name);
  }

  @Mutation(() => Boolean, {
    description: 'character 가져오기',
  })
  upsert(@Args('name', { type: () => String }) name: string) {
    return this.characterService.upsert(name);
  }
}
