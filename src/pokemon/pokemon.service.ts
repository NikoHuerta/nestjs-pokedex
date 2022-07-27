import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>
  ){}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try{
      const pokemon = await this.pokemonModel.create( createPokemonDto );
      return pokemon;
    } catch (error) {
      this.handleExceptions( error, 'create' );
    }


    
  }

  async findAll() {
    const pokemons: Pokemon[] = await this.pokemonModel.find();
    return pokemons;
  }

  async findOne(term: string) {

    let pokemon: Pokemon;

    if( !isNaN(+term) )
      pokemon = await this.pokemonModel.findOne({ no: term });
    if( !pokemon && isValidObjectId( term ) )
      pokemon = await this.pokemonModel.findById( term );
    if( !pokemon )
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() });
    if ( !pokemon )
      throw new NotFoundException(`Pokemon with id, name or number "${ term }" not found`);

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    
    const pokemon = await this.findOne( term );

    if( updatePokemonDto.name )
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();

    try {
      await pokemon.updateOne( updatePokemonDto, { new: true } );
      return {
        ...pokemon.toJSON(),
        ...updatePokemonDto
      };
    } catch (error) {
      this.handleExceptions( error, 'update' );
    }

    
  }

  async remove(id: string) {

    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    
    if( deletedCount === 0 )
      throw new NotFoundException(`Pokemon with id "${ id }" not found`);
    
    return true;
  }
  
  private handleExceptions( error: any, action: string ){
    if ( error.code === 11000 ){
      throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify( error.keyValue ) }`);
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't ${ action } Pokemon - Check server logs`);
  }

}