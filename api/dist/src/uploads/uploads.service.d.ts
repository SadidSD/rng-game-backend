export declare class UploadsService {
    private readonly uploadDir;
    constructor();
    uploadFile(file: any): Promise<{
        url: string;
        filename: string;
        mimetype: any;
    }>;
}
