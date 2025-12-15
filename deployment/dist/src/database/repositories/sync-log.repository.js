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
exports.SyncLogRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
let SyncLogRepository = class SyncLogRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.syncLog.create({
            data: {
                ...data,
                startedAt: new Date(),
            },
        });
    }
    async complete(id, data) {
        const startedLog = await this.prisma.syncLog.findUnique({ where: { id } });
        const durationMs = startedLog ? Date.now() - startedLog.startedAt.getTime() : null;
        return this.prisma.syncLog.update({
            where: { id },
            data: {
                ...data,
                completedAt: new Date(),
                durationMs,
            },
        });
    }
    async incrementRetry(id) {
        return this.prisma.syncLog.update({
            where: { id },
            data: {
                retryCount: {
                    increment: 1,
                },
            },
        });
    }
    async findByTransactionId(transactionId) {
        return this.prisma.syncLog.findMany({
            where: { transactionId },
            orderBy: { startedAt: 'desc' },
        });
    }
    async findByEntityMapping(entityMappingId, limit = 10) {
        return this.prisma.syncLog.findMany({
            where: { entityMappingId },
            orderBy: { startedAt: 'desc' },
            take: limit,
        });
    }
    async findFailedForRetry(maxRetries) {
        return this.prisma.syncLog.findMany({
            where: {
                status: client_1.SyncStatus.FAILED,
                retryCount: {
                    lt: maxRetries,
                },
            },
            orderBy: { startedAt: 'asc' },
            take: 50,
        });
    }
    async getStats(hoursBack = 24) {
        const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        const [total, success, failed, inProgress] = await Promise.all([
            this.prisma.syncLog.count({ where: { startedAt: { gte: since } } }),
            this.prisma.syncLog.count({
                where: { startedAt: { gte: since }, status: client_1.SyncStatus.SUCCESS },
            }),
            this.prisma.syncLog.count({
                where: { startedAt: { gte: since }, status: client_1.SyncStatus.FAILED },
            }),
            this.prisma.syncLog.count({
                where: { startedAt: { gte: since }, status: client_1.SyncStatus.IN_PROGRESS },
            }),
        ]);
        return { total, success, failed, inProgress };
    }
};
exports.SyncLogRepository = SyncLogRepository;
exports.SyncLogRepository = SyncLogRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SyncLogRepository);
//# sourceMappingURL=sync-log.repository.js.map