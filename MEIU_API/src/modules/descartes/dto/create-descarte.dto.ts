import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsPositive,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDescarteDto {
  @ApiProperty({
    description: 'Indica se o material é uma mistura de vários tipos',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  eh_mistura: boolean;

  @ApiProperty({
    description: 'Tipo principal do resíduo (ex: Retalho de corte)',
    example: 'Retalho de corte',
  })
  @IsString()
  @IsNotEmpty()
  residuo_principal: string;

  @ApiProperty({
    description: 'Quantidade aproximada em quilogramas',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  quantidade_kg: number;

  @ApiProperty({
    description: 'Frequência estimada de geração em dias',
    example: 7,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  frequencia_dias: number;

  @ApiProperty({
    description: 'Composição do material (ex: Algodão + Poliéster)',
    example: 'Algodão',
  })
  @IsString()
  @IsNotEmpty()
  material: string;

  @ApiProperty({
    description: 'Estado físico do material (ex: Limpo, Contaminado)',
    example: 'Limpo',
  })
  @IsString()
  @IsNotEmpty()
  estado_material: string;

  @ApiProperty({
    description: 'Aplicação original ou tipo de tecido',
    example: 'Tecido plano',
  })
  @IsString()
  @IsNotEmpty()
  tipo_tecido: string;

  @ApiProperty({
    description: 'Latitude para mapeamento de hotspots',
    example: -23.41,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiProperty({
    description: 'Longitude para mapeamento de hotspots',
    example: -51.44,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon?: number;

  @ApiProperty({
    description: 'ID do ponto de coleta escolhido pelo usuário',
    example: 'a3d7b1a2-1234-4f9a-9a11-abc123456789',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  ponto_coleta_id?: string;
}