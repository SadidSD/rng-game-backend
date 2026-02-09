import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInventoryDto, InventoryAction } from './dto/update-inventory.dto';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class InventoryService {
    constructor(
        private prisma: PrismaService,
        private logger: LoggerService,
    ) {
        this.logger.setContext('InventoryService');
    }

    async getInventory(storeId: string, variantId: string) {
        const item = await this.prisma.inventoryItem.findUnique({
            where: { variantId },
        });

        // Security check: ensure item belongs to store
        if (item && item.storeId !== storeId) {
            throw new NotFoundException('Inventory item not found');
        }

        return item;
    }

    async updateInventory(storeId: string, variantId: string, dto: UpdateInventoryDto) {
        // 1. Check existence and ownership
        const existing = await this.prisma.inventoryItem.findUnique({
            where: { variantId }
        });

        if (!existing) {
            // Option: Create availability if it doesn't exist? 
            // For now, assume Product creation made the InventoryItem row.
            throw new NotFoundException('Inventory record not found for this variant');
        }

        if (existing.storeId !== storeId) {
            throw new NotFoundException('Inventory record not found');
        }

        // 2. Calculate Update
        let newQuantity = existing.quantity;

        if (dto.action === InventoryAction.SET) {
            newQuantity = dto.quantity;
        } else if (dto.action === InventoryAction.ADD) {
            newQuantity += dto.quantity;
        } else if (dto.action === InventoryAction.REMOVE) {
            newQuantity -= dto.quantity;
        }

        if (newQuantity < 0) {
            throw new BadRequestException('Insufficient stock');
        }

        // 3. Perform Update
        const updated = await this.prisma.inventoryItem.update({
            where: { variantId },
            data: { quantity: newQuantity }
        });

        // 4. Check for low stock alert
        const threshold = updated.lowStockThreshold || 5;
        if (newQuantity <= threshold && newQuantity > 0) {
            this.logger.warn(`Low stock alert: Variant ${variantId} has ${newQuantity} units (threshold: ${threshold})`);
        } else if (newQuantity === 0) {
            this.logger.error(`Out of stock: Variant ${variantId} is depleted`);
        }

        return updated;
    }

    /**
     * Get all low stock items for a store
     */
    async getLowStockItems(storeId: string) {
        const items = await this.prisma.inventoryItem.findMany({
            where: {
                storeId,
                quantity: { lte: this.prisma.inventoryItem.fields.lowStockThreshold }
            },
            include: {
                variant: {
                    include: { product: true }
                }
            },
            orderBy: { quantity: 'asc' }
        });

        return items.map(item => ({
            variantId: item.variantId,
            productName: item.variant.product.name,
            sku: item.variant.sku,
            quantity: item.quantity,
            threshold: item.lowStockThreshold,
        }));
    }
}
