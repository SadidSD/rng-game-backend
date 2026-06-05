import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @Roles(Role.ADMIN, Role.STAFF)
    create(@Request() req, @Body() createProductDto: CreateProductDto) {
        return this.productsService.create(req.user.storeId, createProductDto);
    }

    @Post('import/lookup')
    @Roles(Role.ADMIN, Role.STAFF)
    importLookup(
        @Request() req,
        @Body() body: { name: string; set?: string; collectorNumber?: string; game?: string }
    ) {
        return this.productsService.importLookup(req.user.storeId, body);
    }

    @Post('import/batch')
    @Roles(Role.ADMIN, Role.STAFF)
    importBatch(
        @Request() req,
        @Body() body: { items: any[] }
    ) {
        return this.productsService.importBatch(req.user.storeId, body.items);
    }

    @Get()
    findAll(@Request() req, @Query() query: { game?: string; search?: string }) {
        return this.productsService.findAll(req.user.storeId, query);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.productsService.findOne(req.user.storeId, id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.STAFF)
    update(@Request() req, @Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(req.user.storeId, id, updateProductDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.OWNER)
    remove(@Request() req, @Param('id') id: string) {
        return this.productsService.remove(req.user.storeId, id);
    }
}
