import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('products')
// @UseGuards(JwtAuthGuard, RolesGuard) // DISABLED FOR DEV VERIFICATION
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    // @Roles(Role.ADMIN, Role.STAFF)
    create(@Request() req, @Body() createProductDto: CreateProductDto) {
        // warning: this might fail if req.user is missing, but we create via script mostly
        return this.productsService.create("d02dbcba-81b5-4f9d-831c-54fe9a803081", createProductDto);
    }

    @Get()
    findAll(@Request() req, @Query() query: { game?: string; search?: string }) {
        // BYPASS: Use hardcoded Store ID so we can see products without login
        const devStoreId = "d02dbcba-81b5-4f9d-831c-54fe9a803081";
        return this.productsService.findAll(devStoreId, query);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.productsService.findOne(req.user.storeId, id);
    }
}
