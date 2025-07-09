export declare enum MessageChannel {
    EMAIL = "email",
    SMS = "sms"
}
export declare class SendMessageDto {
    user_id: string;
    message: string;
    channel: MessageChannel;
    subject?: string;
    metadata?: Record<string, any>;
}
export declare class SendEmailDto {
    user_id: string;
    subject: string;
    message: string;
    metadata?: Record<string, any>;
}
export declare class SendSmsDto {
    user_id: string;
    message: string;
    metadata?: Record<string, any>;
}
export declare class MessageResponseDto {
    message_id: string;
    status: string;
    channel: MessageChannel;
    user_id: string;
    created_at?: string;
    delivered_at?: string;
}
export declare class BulkMessageDto {
    user_ids: string[];
    message: string;
    channel: MessageChannel;
    subject?: string;
    metadata?: Record<string, any>;
}
export declare class BulkMessageResponseDto {
    total_sent: number;
    messages: MessageResponseDto[];
    failed_user_ids?: string[];
}
