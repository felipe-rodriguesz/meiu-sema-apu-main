import { IsString, IsOptional, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePontoColetaDto {
  @ApiProperty({ description: 'Nome do ponto de coleta', example: 'Centro de Coleta - Centro' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Tipo do ponto', example: 'Ponto Fixo' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ description: 'Bairro onde está localizado', example: 'Centro', required: false })
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiProperty({ description: 'Endereço completo (opcional)', example: 'Rua Principal, 123', required: false })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiProperty({ description: 'Latitude do ponto', example: -23.5505, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiProperty({ description: 'Longitude do ponto', example: -46.6333, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon?: number;
}