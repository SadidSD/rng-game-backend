import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @Roles(Role.ADMIN, Role.STAFF)
    create(@Request() req, @Body() createProductDto: CreateProductDto) {
        return this.productsService.create(req.user.storeId, createProductDto);
    }

    @Get()
    findAll(@Request() req, @Query() query: { game?: string; search?: string }) {
        return this.productsService.findAll(req.user.storeId, query);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.productsService.findOne(req.user.storeId, id);
    }
}
