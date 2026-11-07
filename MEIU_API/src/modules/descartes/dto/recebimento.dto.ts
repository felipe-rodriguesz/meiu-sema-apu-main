import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsPositive, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecebimentoDto {
  @ApiProperty({ example: 8.7 })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Informe o peso aferido em kg com até três casas decimais.' })
  @IsPositive({ message: 'O peso aferido deve ser maior que zero.' }) @Max(999999999.999)
  peso_recebido_kg: number;
}

export class CorrigirRecebimentoDto extends RecebimentoDto {
  @ApiProperty({ description: 'Justificativa da correção.' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(5, { message: 'Explique a correção com pelo menos cinco caracteres.' }) @MaxLength(500)
  motivo: string;

  @ApiProperty({ description: 'Versão exibida ao abrir o pedido; impede sobrescrever outra correção.' })
  @IsInt() @Min(1) @Max(2147483646)
  versao: number;
}
