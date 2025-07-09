import {
  Controller,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { BookboostService } from './bookboost.service';
import {
  CreateUserDto,
  LinkExternalRefDto,
  TagUserDto,
  UserResponseDto,
} from './dtos/user.dto';
import {
  SendMessageDto,
  SendEmailDto,
  SendSmsDto,
  BulkMessageDto,
  MessageResponseDto,
  BulkMessageResponseDto,
  MessageChannel,
} from './dtos/message.dto';

@ApiTags('Bookboost CDP')
@Controller('bookboost')
@UsePipes(new ValidationPipe({ transform: true }))
export class BookboostController {
  constructor(private readonly bookboostService: BookboostService) {}

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create or update a user',
    description:
      'Creates a new user in Bookboost CDP or updates an existing user if they already exist.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User data to create or update',
  })
  @ApiCreatedResponse({
    description: 'User created or updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid user data provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid user data' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Internal server error' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async upsertUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.bookboostService.upsertUser(createUserDto);
  }

  @Post('users/:userId/external-reference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Link external system reference',
    description:
      'Links an external system user ID to a Bookboost user for cross-system integration.',
  })
  @ApiParam({
    name: 'userId',
    description: 'Bookboost user ID',
    example: 'user-123',
  })
  @ApiBody({
    type: LinkExternalRefDto,
    description: 'External reference data',
  })
  @ApiOkResponse({
    description: 'External reference linked successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'External reference linked successfully',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid external reference data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async linkExternalRef(
    @Param('userId') userId: string,
    @Body() linkExternalRefDto: LinkExternalRefDto,
  ): Promise<{ message: string }> {
    await this.bookboostService.linkExternalRef(
      userId,
      linkExternalRefDto.external_id,
    );
    return { message: 'External reference linked successfully' };
  }

  @Post('users/:userId/tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tag a user',
    description:
      'Assigns tags to a user for segmentation and automation purposes.',
  })
  @ApiParam({
    name: 'userId',
    description: 'Bookboost user ID',
    example: 'user-123',
  })
  @ApiBody({
    type: TagUserDto,
    description: 'Tags to assign to the user',
  })
  @ApiOkResponse({
    description: 'Tags assigned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Tags assigned successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid tag data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async tagUser(
    @Param('userId') userId: string,
    @Body() tagUserDto: TagUserDto,
  ): Promise<{ message: string }> {
    await this.bookboostService.tagUser(userId, tagUserDto.tags);
    return { message: 'Tags assigned successfully' };
  }

  @Post('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a message',
    description:
      'Sends an email or SMS message to a user through Bookboost CDP.',
  })
  @ApiBody({
    type: SendMessageDto,
    description: 'Message data to send',
  })
  @ApiOkResponse({
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid message data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    await this.bookboostService.sendMessage({
      user_id: sendMessageDto.user_id,
      message: sendMessageDto.message,
      channel: sendMessageDto.channel,
    });

    return {
      message_id: `msg-${Date.now()}`,
      status: 'queued',
      channel: sendMessageDto.channel,
      user_id: sendMessageDto.user_id,
      created_at: new Date().toISOString(),
    };
  }

  @Post('messages/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send an email',
    description: 'Sends an email message to a user through Bookboost CDP.',
  })
  @ApiBody({
    type: SendEmailDto,
    description: 'Email data to send',
  })
  @ApiOkResponse({
    description: 'Email sent successfully',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid email data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async sendEmail(
    @Body() sendEmailDto: SendEmailDto,
  ): Promise<MessageResponseDto> {
    await this.bookboostService.sendMessage({
      user_id: sendEmailDto.user_id,
      message: sendEmailDto.message,
      channel: MessageChannel.EMAIL,
    });

    return {
      message_id: `email-${Date.now()}`,
      status: 'queued',
      channel: MessageChannel.EMAIL,
      user_id: sendEmailDto.user_id,
      created_at: new Date().toISOString(),
    };
  }

  @Post('messages/sms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send an SMS',
    description: 'Sends an SMS message to a user through Bookboost CDP.',
  })
  @ApiBody({
    type: SendSmsDto,
    description: 'SMS data to send',
  })
  @ApiOkResponse({
    description: 'SMS sent successfully',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid SMS data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async sendSms(@Body() sendSmsDto: SendSmsDto): Promise<MessageResponseDto> {
    await this.bookboostService.sendMessage({
      user_id: sendSmsDto.user_id,
      message: sendSmsDto.message,
      channel: MessageChannel.SMS,
    });

    return {
      message_id: `sms-${Date.now()}`,
      status: 'queued',
      channel: MessageChannel.SMS,
      user_id: sendSmsDto.user_id,
      created_at: new Date().toISOString(),
    };
  }

  @Post('messages/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send bulk messages',
    description:
      'Sends messages to multiple users in bulk through Bookboost CDP.',
  })
  @ApiBody({
    type: BulkMessageDto,
    description: 'Bulk message data',
  })
  @ApiOkResponse({
    description: 'Bulk messages sent successfully',
    type: BulkMessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid bulk message data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async sendBulkMessages(
    @Body() bulkMessageDto: BulkMessageDto,
  ): Promise<BulkMessageResponseDto> {
    const messages: MessageResponseDto[] = [];
    const failedUserIds: string[] = [];

    // Send messages to all users
    for (const userId of bulkMessageDto.user_ids) {
      try {
        await this.bookboostService.sendMessage({
          user_id: userId,
          message: bulkMessageDto.message,
          channel: bulkMessageDto.channel,
        });

        messages.push({
          message_id: `${bulkMessageDto.channel}-${Date.now()}-${userId}`,
          status: 'queued',
          channel: bulkMessageDto.channel,
          user_id: userId,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        failedUserIds.push(userId);
      }
    }

    return {
      total_sent: messages.length,
      messages,
      failed_user_ids: failedUserIds.length > 0 ? failedUserIds : undefined,
    };
  }

  @Post('users/:userId/onboard')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Complete user onboarding',
    description:
      'Performs a complete user onboarding flow: creates user, links external reference, and assigns initial tags.',
  })
  @ApiParam({
    name: 'userId',
    description: 'Bookboost user ID',
    example: 'user-123',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User data for onboarding',
  })
  @ApiCreatedResponse({
    description: 'User onboarded successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid onboarding data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async onboardUser(
    @Param('userId') userId: string,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    // Create/update user
    const user = await this.bookboostService.upsertUser(createUserDto);

    // Link external reference
    await this.bookboostService.linkExternalRef(user.id, userId);

    // Assign onboarding tags
    await this.bookboostService.tagUser(user.id, ['onboarded', 'new-user']);

    return user;
  }
}
