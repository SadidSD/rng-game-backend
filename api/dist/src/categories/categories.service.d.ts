import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(storeId: string, createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string | null;
    }>;
    findAll(storeId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string | null;
    }[]>;
    findOne(storeId: string, id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string | null;
    }>;
    update(storeId: string, id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string | null;
    }>;
    remove(storeId: string, id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string | null;
    }>;
}
