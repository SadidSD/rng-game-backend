import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(req: any, createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string | null;
    }>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string | null;
    }>;
    remove(id: string): Promise<{
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
