import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInventoryDto, InventoryAction } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) { }

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

        return updated;
    }
}
