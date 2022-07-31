import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AxiosAdapter } from 'src/common/adapters/axios.adapter';
import { CreatePokemonDto } from 'src/pokemon/dto/create-pokemon.dto';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { PokeResponse } from './interface/poke-response.interface';

@Injectable()
export class SeedService {

  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter,
  ){}
  
  async executeSeed() {
    let pokemons: CreatePokemonDto[] = [];
    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=649');

    data.results.forEach(({ name, url }) => {
      const segments = url.split('/');
      const no: number = +segments[segments.length - 2];
      pokemons.push({ name, no });
    });

    try{
      await this.pokemonModel.deleteMany({});
      await this.pokemonModel.insertMany(pokemons);
    } catch ( error ) {
      throw new InternalServerErrorException(`Can't generate the seed - Check server logs`); 
    }
    return true;
  }

}
