import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(storeId: string, createCategoryDto: CreateCategoryDto) {
        const slug = createCategoryDto.slug || createCategoryDto.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        return this.prisma.category.create({
            data: {
                ...createCategoryDto,
                slug,
                storeId,
            },
        });
    }

    async findAll(storeId: string) {
        return this.prisma.category.findMany({
            where: { storeId },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(storeId: string, id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category || category.storeId !== storeId) {
            throw new NotFoundException('Category not found');
        }
        return category;
    }

    async update(storeId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
        await this.findOne(storeId, id); // check exist
        return this.prisma.category.update({
            where: { id },
            data: updateCategoryDto,
        });
    }

    async remove(storeId: string, id: string) {
        await this.findOne(storeId, id); // check exist
        return this.prisma.category.delete({
            where: { id },
        });
    }
}
