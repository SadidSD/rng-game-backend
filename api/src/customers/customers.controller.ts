import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF) // Detailed access control can be refined later
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    create(@Request() req, @Body() dto: CreateCustomerDto) {
        return this.customersService.create(req.user.storeId, dto);
    }

    @Get()
    findAll(@Request() req, @Query('search') search: string) {
        return this.customersService.findAll(req.user.storeId, search);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.customersService.findOne(req.user.storeId, id);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
        return this.customersService.update(req.user.storeId, id, dto);
    }
}
