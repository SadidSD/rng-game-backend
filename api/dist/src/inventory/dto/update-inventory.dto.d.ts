export declare enum InventoryAction {
    ADD = "ADD",
    REMOVE = "REMOVE",
    SET = "SET"
}
export declare class UpdateInventoryDto {
    action: InventoryAction;
    quantity: number;
    reason?: string;
}
