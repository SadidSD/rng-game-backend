import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    // @UseGuards(JwtAuthGuard) // Disabled for quick testing, but should be enabled
    create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
        // HARDCODED STORE ID FOR DEV
        const devStoreId = "d02dbcba-81b5-4f9d-831c-54fe9a803081";
        return this.categoriesService.create(devStoreId, createCategoryDto);
    }

    @Get()
    // Publicly accessible via API Key or just Public?
    // Let's allow public access for now for simplicity, or check API Key
    findAll() {
        // HARDCODED STORE ID FOR DEV
        const devStoreId = "d02dbcba-81b5-4f9d-831c-54fe9a803081";
        return this.categoriesService.findAll(devStoreId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        const devStoreId = "d02dbcba-81b5-4f9d-831c-54fe9a803081";
        return this.categoriesService.findOne(devStoreId, id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        const devStoreId = "d02dbcba-81b5-4f9d-831c-54fe9a803081";
        return this.categoriesService.update(devStoreId, id, updateCategoryDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        const devStoreId = "d02dbcba-81b5-4f9d-831c-54fe9a803081";
        return this.categoriesService.remove(devStoreId, id);
    }
}
