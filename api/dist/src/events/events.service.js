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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EventsService = class EventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(storeId, dto) {
        return this.prisma.event.create({
            data: {
                name: dto.name,
                description: dto.description,
                date: new Date(dto.date),
                maxPlayers: dto.maxPlayers,
                storeId,
            },
        });
    }
    async findAll(storeId) {
        return this.prisma.event.findMany({
            where: { storeId },
            orderBy: { date: 'asc' },
            include: { _count: { select: { players: true } } }
        });
    }
    async findOne(storeId, id) {
        const event = await this.prisma.event.findFirst({
            where: { id, storeId },
            include: { players: true }
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return event;
    }
    async registerPlayer(storeId, eventId, dto) {
        const event = await this.findOne(storeId, eventId);
        if (event.maxPlayers && event.players.length >= event.maxPlayers) {
            throw new Error('Event is full');
        }
        return this.prisma.eventPlayer.create({
            data: {
                eventId,
                playerName: dto.playerName,
                playerEmail: dto.playerEmail
            }
        });
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map