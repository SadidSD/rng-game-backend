import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import EasyPostClient from '@easypost/api';

@Injectable()
export class EasypostService {
    private client: any;
    private readonly logger = new Logger(EasypostService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('EASYPOST_API_KEY');
        if (apiKey) {
            this.client = new EasyPostClient(apiKey);
            this.logger.log('EasyPost Client Successfully Initialized');
        } else {
            this.logger.warn('EASYPOST_API_KEY is not set - EasyPost features will be disabled');
        }
    }

    /**
     * Create a shipment to fetch live rates
     */
    async createShipment(toAddressParams: any, fromAddressParams: any, parcelParams: any) {
        if (!this.client) throw new Error('EasyPost API key missing');

        try {
            const shipment = await this.client.Shipment.create({
                to_address: toAddressParams,
                from_address: fromAddressParams,
                parcel: parcelParams,
            });

            return shipment;
        } catch (error: any) {
            this.logger.error(`Failed to create shipment: ${error.message}`);
            throw error;
        }
    }

    /**
     * Buy a label using a shipmentId and a specific rateId
     */
    async buyLabel(shipmentId: string, rateId: string) {
        if (!this.client) throw new Error('EasyPost API key missing');

        try {
            // First retrieve the shipment
            const shipment = await this.client.Shipment.retrieve(shipmentId);
            
            // Then buy the specific rate
            const boughtShipment = await this.client.Shipment.buy(shipment.id, rateId);
            
            return {
                trackingCode: boughtShipment.tracking_code,
                trackingUrl: boughtShipment.tracker?.public_url,
                labelUrl: boughtShipment.postage_label?.label_url,
                status: boughtShipment.status
            };
        } catch (error: any) {
            this.logger.error(`Failed to purchase label: ${error.message}`);
            throw error;
        }
    }
}
