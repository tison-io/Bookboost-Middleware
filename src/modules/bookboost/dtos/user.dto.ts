import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Additional user metadata',
    example: { preferences: ['newsletter', 'sms'] },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateUserDto implements Partial<CreateUserDto> {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Additional user metadata',
    example: { preferences: ['newsletter', 'sms'] },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class LinkExternalRefDto {
  @ApiProperty({
    description: 'Bookboost user ID',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'External system user ID',
    example: 'visbook-user-456',
  })
  @IsString()
  @IsNotEmpty()
  external_id: string;

  @ApiPropertyOptional({
    description: 'Source system name',
    example: 'visbook',
    default: 'visbook',
  })
  @IsString()
  @IsOptional()
  source?: string;
}

export class TagUserDto {
  @ApiProperty({
    description: 'Bookboost user ID',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Array of tags to assign to the user',
    example: ['premium', 'newsletter', 'vip'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class UserResponseDto {
  @ApiProperty({
    description: 'Bookboost user ID',
    example: 'user-123',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  last_name: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  created_at?: string;

  @ApiPropertyOptional({
    description: 'User last update timestamp',
    example: '2024-01-02T00:00:00Z',
  })
  updated_at?: string;
}
