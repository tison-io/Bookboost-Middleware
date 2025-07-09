import { BookboostService } from './bookboost.service';
import { CreateUserDto, LinkExternalRefDto, TagUserDto, UserResponseDto } from './dtos/user.dto';
import { SendMessageDto, SendEmailDto, SendSmsDto, BulkMessageDto, MessageResponseDto, BulkMessageResponseDto } from './dtos/message.dto';
export declare class BookboostController {
    private readonly bookboostService;
    constructor(bookboostService: BookboostService);
    upsertUser(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    linkExternalRef(userId: string, linkExternalRefDto: LinkExternalRefDto): Promise<{
        message: string;
    }>;
    tagUser(userId: string, tagUserDto: TagUserDto): Promise<{
        message: string;
    }>;
    sendMessage(sendMessageDto: SendMessageDto): Promise<MessageResponseDto>;
    sendEmail(sendEmailDto: SendEmailDto): Promise<MessageResponseDto>;
    sendSms(sendSmsDto: SendSmsDto): Promise<MessageResponseDto>;
    sendBulkMessages(bulkMessageDto: BulkMessageDto): Promise<BulkMessageResponseDto>;
    onboardUser(userId: string, createUserDto: CreateUserDto): Promise<UserResponseDto>;
}
