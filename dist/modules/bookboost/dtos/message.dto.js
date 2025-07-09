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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkMessageResponseDto = exports.BulkMessageDto = exports.MessageResponseDto = exports.SendSmsDto = exports.SendEmailDto = exports.SendMessageDto = exports.MessageChannel = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var MessageChannel;
(function (MessageChannel) {
    MessageChannel["EMAIL"] = "email";
    MessageChannel["SMS"] = "sms";
})(MessageChannel || (exports.MessageChannel = MessageChannel = {}));
class SendMessageDto {
    user_id;
    message;
    channel;
    subject;
    metadata;
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bookboost user ID to send message to',
        example: 'user-123',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message content to send',
        example: 'Welcome to our platform! Your account has been created successfully.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message delivery channel',
        enum: MessageChannel,
        example: MessageChannel.EMAIL,
    }),
    (0, class_validator_1.IsEnum)(MessageChannel),
    __metadata("design:type", String)
], SendMessageDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message subject (for email messages)',
        example: 'Welcome to BookBoost',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional message metadata',
        example: { campaign_id: 'campaign-123', template: 'welcome' },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendMessageDto.prototype, "metadata", void 0);
class SendEmailDto {
    user_id;
    subject;
    message;
    metadata;
}
exports.SendEmailDto = SendEmailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bookboost user ID to send email to',
        example: 'user-123',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendEmailDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email subject line',
        example: 'Welcome to BookBoost',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendEmailDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email message content',
        example: 'Welcome to our platform! Your account has been created successfully.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendEmailDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional email metadata',
        example: { campaign_id: 'campaign-123', template: 'welcome' },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendEmailDto.prototype, "metadata", void 0);
class SendSmsDto {
    user_id;
    message;
    metadata;
}
exports.SendSmsDto = SendSmsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bookboost user ID to send SMS to',
        example: 'user-123',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SMS message content',
        example: 'Your booking confirmation: #12345. Thank you for choosing us!',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional SMS metadata',
        example: { campaign_id: 'campaign-123', priority: 'high' },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendSmsDto.prototype, "metadata", void 0);
class MessageResponseDto {
    message_id;
    status;
    channel;
    user_id;
    created_at;
    delivered_at;
}
exports.MessageResponseDto = MessageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique message ID',
        example: 'msg-456',
    }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "message_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message delivery status',
        example: 'queued',
    }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message delivery channel',
        enum: MessageChannel,
        example: MessageChannel.EMAIL,
    }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Target user ID',
        example: 'user-123',
    }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message creation timestamp',
        example: '2024-01-01T00:00:00Z',
    }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message delivery timestamp',
        example: '2024-01-01T00:01:00Z',
    }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "delivered_at", void 0);
class BulkMessageDto {
    user_ids;
    message;
    channel;
    subject;
    metadata;
}
exports.BulkMessageDto = BulkMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of user IDs to send messages to',
        example: ['user-123', 'user-456', 'user-789'],
        type: [String],
    }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkMessageDto.prototype, "user_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message content to send to all users',
        example: 'Important update: Your booking has been confirmed!',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkMessageDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message delivery channel',
        enum: MessageChannel,
        example: MessageChannel.EMAIL,
    }),
    (0, class_validator_1.IsEnum)(MessageChannel),
    __metadata("design:type", String)
], BulkMessageDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message subject (for email messages)',
        example: 'Booking Confirmation',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkMessageDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional message metadata',
        example: { campaign_id: 'bulk-campaign-123' },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], BulkMessageDto.prototype, "metadata", void 0);
class BulkMessageResponseDto {
    total_sent;
    messages;
    failed_user_ids;
}
exports.BulkMessageResponseDto = BulkMessageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of messages sent',
        example: 3,
    }),
    __metadata("design:type", Number)
], BulkMessageResponseDto.prototype, "total_sent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of message responses',
        type: [MessageResponseDto],
    }),
    __metadata("design:type", Array)
], BulkMessageResponseDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array of failed user IDs',
        example: ['user-999'],
        type: [String],
    }),
    __metadata("design:type", Array)
], BulkMessageResponseDto.prototype, "failed_user_ids", void 0);
//# sourceMappingURL=message.dto.js.map