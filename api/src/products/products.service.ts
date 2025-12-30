import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async create(storeId: string, dto: CreateProductDto) {
        // Generate a simple slug
        const slug = dto.name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();

        return this.prisma.product.create({
            data: {
                name: dto.name,
                description: dto.description,
                game: dto.game,
                set: dto.set,
                slug: slug,
                images: dto.images || [],
                storeId,
                variants: {
                    create: dto.variants?.map(v => ({
                        condition: v.condition,
                        isFoil: v.isFoil || false,
                        language: v.language || 'English',
                        price: v.price,
                        storeId,
                        inventory: {
                            create: {
                                quantity: v.quantity,
                                storeId
                            }
                        }
                    })),
                },
            },
            include: {
                variants: {
                    include: { inventory: true }
                }
            },
        });
    }

    async findAll(storeId: string, query: { game?: string; search?: string }) {
        const where: any = { storeId };

        if (query.game) {
            where.game = query.game;
        }
        if (query.search) {
            where.name = { contains: query.search, mode: 'insensitive' };
        }

        return this.prisma.product.findMany({
            where,
            include: { variants: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(storeId: string, id: string) {
        const product = await this.prisma.product.findFirst({
            where: { id, storeId },
            include: {
                variants: {
                    include: { inventory: true }
                }
            }
        });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }
}
