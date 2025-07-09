import { HttpService } from '@nestjs/axios';
export declare class BookboostService {
    private readonly http;
    private readonly baseUrl;
    private readonly token;
    constructor(http: HttpService);
    private getHeaders;
    upsertUser(userPayload: any): Promise<any>;
    linkExternalRef(userId: string, externalId: string): Promise<void>;
    tagUser(userId: string, tags: string[]): Promise<void>;
    sendMessage(payload: {
        user_id: string;
        message: string;
        channel: 'email' | 'sms';
    }): Promise<void>;
    private handleError;
}
