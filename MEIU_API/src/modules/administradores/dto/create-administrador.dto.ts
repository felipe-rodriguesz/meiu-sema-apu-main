// src/administradores/dto/create-administrador.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  MinLength
} from 'class-validator';

export class CreateAdministradorDto {
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  senha: string;
}