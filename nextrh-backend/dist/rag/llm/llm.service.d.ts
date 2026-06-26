import { ConfigService } from '@nestjs/config';
export declare class LlmService {
    private configService;
    private chatModel;
    constructor(configService: ConfigService);
    generate(prompt: string): Promise<string>;
}
