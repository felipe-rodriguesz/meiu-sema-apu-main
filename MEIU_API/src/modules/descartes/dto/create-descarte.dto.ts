import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsNotEmpty, IsPositive, MaxLength, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateDescarteDto {
  @ApiProperty() @IsBoolean()
  eh_mistura: boolean;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150)
  residuo_principal: string;

  @ApiProperty({ example: 2.5, description: 'Peso declarado em kg, positivo e com até três casas decimais.' })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Informe o peso em kg com até três casas decimais.' })
  @IsPositive({ message: 'O peso deve ser maior que zero.' }) @Max(999999999.999)
  quantidade_kg: number;

  @ApiProperty({ example: 7 })
  @IsInt({ message: 'A frequência deve ser um número inteiro de dias.' })
  @Min(1, { message: 'A frequência deve ser de pelo menos um dia.' }) @Max(2147483647)
  frequencia_dias: number;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150)
  material: string;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150)
  estado_material: string;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150)
  tipo_tecido: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(-90) @Max(90)
  lat?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(-180) @Max(180)
  lon?: number;

  @ApiProperty({ description: 'Ponto ativo escolhido pelo gerador.' })
  @IsUUID('all', { message: 'Selecione um ponto de coleta válido.' })
  ponto_coleta_id: string;
}
