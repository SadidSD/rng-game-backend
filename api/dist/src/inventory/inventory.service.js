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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const update_inventory_dto_1 = require("./dto/update-inventory.dto");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getInventory(storeId, variantId) {
        const item = await this.prisma.inventoryItem.findUnique({
            where: { variantId },
        });
        if (item && item.storeId !== storeId) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        return item;
    }
    async updateInventory(storeId, variantId, dto) {
        const existing = await this.prisma.inventoryItem.findUnique({
            where: { variantId }
        });
        if (!existing) {
            throw new common_1.NotFoundException('Inventory record not found for this variant');
        }
        if (existing.storeId !== storeId) {
            throw new common_1.NotFoundException('Inventory record not found');
        }
        let newQuantity = existing.quantity;
        if (dto.action === update_inventory_dto_1.InventoryAction.SET) {
            newQuantity = dto.quantity;
        }
        else if (dto.action === update_inventory_dto_1.InventoryAction.ADD) {
            newQuantity += dto.quantity;
        }
        else if (dto.action === update_inventory_dto_1.InventoryAction.REMOVE) {
            newQuantity -= dto.quantity;
        }
        if (newQuantity < 0) {
            throw new common_1.BadRequestException('Insufficient stock');
        }
        const updated = await this.prisma.inventoryItem.update({
            where: { variantId },
            data: { quantity: newQuantity }
        });
        return updated;
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map