interface CleanupOptions {
    dryRun?: boolean;
    prefix?: string;
    ttlSeconds?: number;
}
interface ResourceInfo {
    public_id: string;
    resource_type: string;
    secure_url: string;
    created_at: string;
    bytes?: number;
}
interface CleanupResult {
    deleted: number;
    failed: number;
    candidates: ResourceInfo[];
    errors: string[];
    details: Array<{
        public_id: string;
        resource_type: string;
        secure_url: string;
    }>;
}
export declare function cleanupOldResources(options?: CleanupOptions): Promise<CleanupResult>;
export {};
//# sourceMappingURL=cleanup.service.d.ts.map