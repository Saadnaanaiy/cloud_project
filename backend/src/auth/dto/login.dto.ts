import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'long-captcha-token' })
  @IsNotEmpty({ message: 'Please complete the CAPTCHA' })
  @IsString()
  captchaToken: string;
}
