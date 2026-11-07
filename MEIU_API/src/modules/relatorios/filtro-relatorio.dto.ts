import { IsDateString, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class FiltroRelatorioDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true })
  inicio?: string;

  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true })
  fim?: string;

  @IsOptional() @IsIn(['registro', 'recebimento'])
  base_data?: 'registro' | 'recebimento';

  @IsOptional() @IsUUID()
  ponto_coleta_id?: string;

  @IsOptional() @IsString() @MaxLength(150)
  residuo_principal?: string;

  @IsOptional() @IsIn(['PENDENTE', 'RECEBIDO'])
  situacao?: string;
}
