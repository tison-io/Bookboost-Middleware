export declare class CreateUserDto {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    metadata?: Record<string, any>;
}
export declare class UpdateUserDto implements Partial<CreateUserDto> {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: Record<string, any>;
}
export declare class LinkExternalRefDto {
    user_id: string;
    external_id: string;
    source?: string;
}
export declare class TagUserDto {
    user_id: string;
    tags: string[];
}
export declare class UserResponseDto {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    created_at?: string;
    updated_at?: string;
}
