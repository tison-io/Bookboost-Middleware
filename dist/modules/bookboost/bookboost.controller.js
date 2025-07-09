"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookboostController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bookboost_service_1 = require("./bookboost.service");
const user_dto_1 = require("./dtos/user.dto");
const message_dto_1 = require("./dtos/message.dto");
let BookboostController = class BookboostController {
    bookboostService;
    constructor(bookboostService) {
        this.bookboostService = bookboostService;
    }
    async upsertUser(createUserDto) {
        return this.bookboostService.upsertUser(createUserDto);
    }
    async linkExternalRef(userId, linkExternalRefDto) {
        await this.bookboostService.linkExternalRef(userId, linkExternalRefDto.external_id);
        return { message: 'External reference linked successfully' };
    }
    async tagUser(userId, tagUserDto) {
        await this.bookboostService.tagUser(userId, tagUserDto.tags);
        return { message: 'Tags assigned successfully' };
    }
    async sendMessage(sendMessageDto) {
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
    async sendEmail(sendEmailDto) {
        await this.bookboostService.sendMessage({
            user_id: sendEmailDto.user_id,
            message: sendEmailDto.message,
            channel: message_dto_1.MessageChannel.EMAIL,
        });
        return {
            message_id: `email-${Date.now()}`,
            status: 'queued',
            channel: message_dto_1.MessageChannel.EMAIL,
            user_id: sendEmailDto.user_id,
            created_at: new Date().toISOString(),
        };
    }
    async sendSms(sendSmsDto) {
        await this.bookboostService.sendMessage({
            user_id: sendSmsDto.user_id,
            message: sendSmsDto.message,
            channel: message_dto_1.MessageChannel.SMS,
        });
        return {
            message_id: `sms-${Date.now()}`,
            status: 'queued',
            channel: message_dto_1.MessageChannel.SMS,
            user_id: sendSmsDto.user_id,
            created_at: new Date().toISOString(),
        };
    }
    async sendBulkMessages(bulkMessageDto) {
        const messages = [];
        const failedUserIds = [];
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
            }
            catch (error) {
                failedUserIds.push(userId);
            }
        }
        return {
            total_sent: messages.length,
            messages,
            failed_user_ids: failedUserIds.length > 0 ? failedUserIds : undefined,
        };
    }
    async onboardUser(userId, createUserDto) {
        const user = await this.bookboostService.upsertUser(createUserDto);
        await this.bookboostService.linkExternalRef(user.id, userId);
        await this.bookboostService.tagUser(user.id, ['onboarded', 'new-user']);
        return user;
    }
};
exports.BookboostController = BookboostController;
__decorate([
    (0, common_1.Post)('users'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create or update a user',
        description: 'Creates a new user in Bookboost CDP or updates an existing user if they already exist.',
    }),
    (0, swagger_1.ApiBody)({
        type: user_dto_1.CreateUserDto,
        description: 'User data to create or update',
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'User created or updated successfully',
        type: user_dto_1.UserResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid user data provided',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: { type: 'string', example: 'Invalid user data' },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Invalid or missing authentication token',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Unauthorized' },
                error: { type: 'string', example: 'Unauthorized' },
            },
        },
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 500 },
                message: { type: 'string', example: 'Internal server error' },
                error: { type: 'string', example: 'Internal Server Error' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], BookboostController.prototype, "upsertUser", null);
__decorate([
    (0, common_1.Post)('users/:userId/external-reference'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Link external system reference',
        description: 'Links an external system user ID to a Bookboost user for cross-system integration.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'Bookboost user ID',
        example: 'user-123',
    }),
    (0, swagger_1.ApiBody)({
        type: user_dto_1.LinkExternalRefDto,
        description: 'External reference data',
    }),
    (0, swagger_1.ApiOkResponse)({
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
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid external reference data',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Invalid or missing authentication token',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.LinkExternalRefDto]),
    __metadata("design:returntype", Promise)
], BookboostController.prototype, "linkExternalRef", null);
__decorate([
    (0, common_1.Post)('users/:userId/tags'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Tag a user',
        description: 'Assigns tags to a user for segmentation and automation purposes.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'Bookboost user ID',
        example: 'user-123',
    }),
    (0, swagger_1.ApiBody)({
        type: user_dto_1.TagUserDto,
        description: 'Tags to assign to the user',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Tags assigned successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Tags assigned successfully' },
            },
        },
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid tag data',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Invalid or missing authentication token',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.TagUserDto]),
    __metadata("design:returntype", Promise)
], BookboostController.prototype, "tagUser", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Send a message',
        description: 'Sends an email or SMS message to a user through Bookboost CDP.',
    }),
    (0, swagger_1.ApiBody)({
        type: message_dto_1.SendMessageDto,
        description: 'Message data to send',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Message sent successfully',
        type: message_dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid message data',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Invalid or missing authentication token',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], BookboostController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('messages/email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Send an email',
        description: 'Sends an email message to a user through Bookboost CDP.',
    }),
    (0, swagger_1.ApiBody)({
        type: message_dto_1.SendEmailDto,
        description: 'Email data to send',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Email sent successfully',
        type: message_dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid email data',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Invalid or missing authentication token',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [message_dto_1.SendEmailDto]),
    __metadata("design:returntype", Promise)
], BookboostController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('messages/sms'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Send an SMS',
        description: 'Sends an SMS message to a user through Bookboost CDP.',
    }),
    (0, swagger_1.ApiBody)({
        type: message_dto_1.SendSmsDto,
        description: 'SMS data to send',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'SMS sent successfully',
        type: message_dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid SMS data',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Invalid or missing authentication token',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [message_dto_1.SendSmsDto]),
    __metadata("design:returntype", Promise)
], BookboostController.prototype, "sendSms", null);
__decorate([
    (0, common_1.Post)('messages/bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Send bulk messages',
        description: 'Sends messages to multiple users in bulk through Bookboost CDP.',
    }),
    (0, swagger_1.ApiBody)({
        type: message_dto_1.BulkMessageDto,
        description: 'Bulk message data',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Bulk messages sent successfully',
        type: message_dto_1.BulkMessageResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid bulk message data',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Invalid or missing authentication token',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [message_dto_1.BulkMessageDto]),
    __metadata("design:returntype", Promise)
], BookboostController.prototype, "sendBulkMessages", null);
__decorate([
    (0, common_1.Post)('users/:userId/onboard'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Complete user onboarding',
        description: 'Performs a complete user onboarding flow: creates user, links external reference, and assigns initial tags.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'Bookboost user ID',
        example: 'user-123',
    }),
    (0, swagger_1.ApiBody)({
        type: user_dto_1.CreateUserDto,
        description: 'User data for onboarding',
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'User onboarded successfully',
        type: user_dto_1.UserResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid onboarding data',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Invalid or missing authentication token',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], BookboostController.prototype, "onboardUser", null);
exports.BookboostController = BookboostController = __decorate([
    (0, swagger_1.ApiTags)('Bookboost CDP'),
    (0, common_1.Controller)('bookboost'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __metadata("design:paramtypes", [bookboost_service_1.BookboostService])
], BookboostController);
//# sourceMappingURL=bookboost.controller.js.map