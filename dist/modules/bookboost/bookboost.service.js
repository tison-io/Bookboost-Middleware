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
exports.BookboostService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const bookboost_config_1 = require("../../config/bookboost.config");
let BookboostService = class BookboostService {
    http;
    baseUrl = bookboost_config_1.bookboostConfig.BASE_URL;
    token = bookboost_config_1.bookboostConfig.TOKEN;
    constructor(http) {
        this.http = http;
    }
    getHeaders() {
        return {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }
    async upsertUser(userPayload) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.http.post(`${this.baseUrl}/users`, userPayload, {
                headers: this.getHeaders(),
            }));
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'upsertUser');
        }
    }
    async linkExternalRef(userId, externalId) {
        try {
            await (0, rxjs_1.firstValueFrom)(this.http.post(`${this.baseUrl}/user-external-reference`, {
                user_id: userId,
                external_id: externalId,
                source: 'visbook',
            }, { headers: this.getHeaders() }));
        }
        catch (error) {
            this.handleError(error, 'linkExternalRef');
        }
    }
    async tagUser(userId, tags) {
        try {
            await (0, rxjs_1.firstValueFrom)(this.http.post(`${this.baseUrl}/user-tags`, {
                user_id: userId,
                tags,
            }, { headers: this.getHeaders() }));
        }
        catch (error) {
            this.handleError(error, 'tagUser');
        }
    }
    async sendMessage(payload) {
        try {
            const url = payload.channel === 'email'
                ? `${this.baseUrl}/message/email`
                : `${this.baseUrl}/message/sms`;
            await (0, rxjs_1.firstValueFrom)(this.http.post(url, payload, { headers: this.getHeaders() }));
        }
        catch (error) {
            this.handleError(error, 'sendMessage');
        }
    }
    handleError(error, method) {
        const msg = `[BookboostService:${method}] ${error?.response?.data?.message || error.message}`;
        const status = error?.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        console.error(msg, error?.response?.data || {});
        throw new common_1.HttpException(msg, status);
    }
};
exports.BookboostService = BookboostService;
exports.BookboostService = BookboostService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], BookboostService);
//# sourceMappingURL=bookboost.service.js.map