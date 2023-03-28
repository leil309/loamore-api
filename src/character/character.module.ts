import { Module } from '@nestjs/common';
import { CharacterResolver } from 'src/character/character.resolver';
import { CharacterService } from 'src/character/character.service';

@Module({
  providers: [CharacterResolver, CharacterService],
})
export class CharacterModule {}
