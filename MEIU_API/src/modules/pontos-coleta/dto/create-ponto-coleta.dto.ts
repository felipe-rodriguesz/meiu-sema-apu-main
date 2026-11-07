import { ArrayMaxSize, ArrayUnique, IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class HorarioDiaDto {
  @IsInt() @Min(0) @Max(6)
  dia: number;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Informe um horário inicial válido (HH:mm).' })
  inicio: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Informe um horário final válido (HH:mm).' })
  fim: string;
}

export class CreatePontoColetaDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @IsNotEmpty() @MaxLength(200)
  nome: string;

  @IsOptional() @IsArray() @ArrayMaxSize(7) @ArrayUnique((item: HorarioDiaDto) => item?.dia)
  @ValidateNested({ each: true }) @Type(() => HorarioDiaDto)
  horarios_semana?: HorarioDiaDto[];

  @Transform(({ value }) => Array.isArray(value) ? value.map(v => typeof v === 'string' ? v.trim() : v) : value)
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ArrayUnique((v: unknown) => typeof v === 'string' ? v.toLocaleLowerCase('pt-BR') : v)
  @IsString({ each: true }) @IsNotEmpty({ each: true }) @MaxLength(2000, { each: true })
  materiais_lista?: string[];

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @IsNotEmpty() @MaxLength(100)
  tipo: string;

  @IsOptional() @IsString() @MaxLength(200)
  bairro?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  endereco?: string;

  @IsOptional() @IsNumber() @Min(-90) @Max(90)
  lat?: number;

  @IsOptional() @IsNumber() @Min(-180) @Max(180)
  lon?: number;

  @IsOptional() @IsArray() @ArrayUnique() @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true })
  dias_semana?: number[];

  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true })
  data_inicio?: string;

  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true })
  data_fim?: string;

  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  horario_inicio?: string;

  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  horario_fim?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  materiais_aceitos?: string;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(999999999.999)
  limite_kg_por_pedido?: number;

  @IsOptional() @IsString() @MaxLength(2000)
  orientacoes?: string;
}
