import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum MessageChannel {
  EMAIL = 'email',
  SMS = 'sms',
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Bookboost user ID to send message to',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Message content to send',
    example:
      'Welcome to our platform! Your account has been created successfully.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Message delivery channel',
    enum: MessageChannel,
    example: MessageChannel.EMAIL,
  })
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @ApiPropertyOptional({
    description: 'Message subject (for email messages)',
    example: 'Welcome to BookBoost',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Additional message metadata',
    example: { campaign_id: 'campaign-123', template: 'welcome' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendEmailDto {
  @ApiProperty({
    description: 'Bookboost user ID to send email to',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Welcome to BookBoost',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Email message content',
    example:
      'Welcome to our platform! Your account has been created successfully.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional email metadata',
    example: { campaign_id: 'campaign-123', template: 'welcome' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendSmsDto {
  @ApiProperty({
    description: 'Bookboost user ID to send SMS to',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'SMS message content',
    example: 'Your booking confirmation: #12345. Thank you for choosing us!',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional SMS metadata',
    example: { campaign_id: 'campaign-123', priority: 'high' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Unique message ID',
    example: 'msg-456',
  })
  message_id: string;

  @ApiProperty({
    description: 'Message delivery status',
    example: 'queued',
  })
  status: string;

  @ApiProperty({
    description: 'Message delivery channel',
    enum: MessageChannel,
    example: MessageChannel.EMAIL,
  })
  channel: MessageChannel;

  @ApiProperty({
    description: 'Target user ID',
    example: 'user-123',
  })
  user_id: string;

  @ApiPropertyOptional({
    description: 'Message creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  created_at?: string;

  @ApiPropertyOptional({
    description: 'Message delivery timestamp',
    example: '2024-01-01T00:01:00Z',
  })
  delivered_at?: string;
}

export class BulkMessageDto {
  @ApiProperty({
    description: 'Array of user IDs to send messages to',
    example: ['user-123', 'user-456', 'user-789'],
    type: [String],
  })
  @IsString({ each: true })
  user_ids: string[];

  @ApiProperty({
    description: 'Message content to send to all users',
    example: 'Important update: Your booking has been confirmed!',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Message delivery channel',
    enum: MessageChannel,
    example: MessageChannel.EMAIL,
  })
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @ApiPropertyOptional({
    description: 'Message subject (for email messages)',
    example: 'Booking Confirmation',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Additional message metadata',
    example: { campaign_id: 'bulk-campaign-123' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BulkMessageResponseDto {
  @ApiProperty({
    description: 'Total number of messages sent',
    example: 3,
  })
  total_sent: number;

  @ApiProperty({
    description: 'Array of message responses',
    type: [MessageResponseDto],
  })
  messages: MessageResponseDto[];

  @ApiPropertyOptional({
    description: 'Array of failed user IDs',
    example: ['user-999'],
    type: [String],
  })
  failed_user_ids?: string[];
}
