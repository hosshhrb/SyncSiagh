declare const _default: () => {
    port: number;
    nodeEnv: string;
    database: {
        url: string | undefined;
    };
    redis: {
        host: string;
        port: number;
    };
    crm: {
        baseUrl: string | undefined;
        token: string | undefined;
    };
    finance: {
        baseUrl: string | undefined;
        username: string | undefined;
        password: string | undefined;
    };
    webhook: {
        secret: string | undefined;
        baseUrl: string | undefined;
    };
    sync: {
        pollIntervalSeconds: number;
        maxRetryAttempts: number;
        enableWebhooks: boolean;
    };
};
export default _default;
