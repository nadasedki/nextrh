"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const common_1 = require("@nestjs/common");
const google_genai_1 = require("@langchain/google-genai");
const human_cjs_1 = require("../../../node_modules/@langchain/core/dist/messages/human.cjs");
class GeminiProvider {
    constructor(configService) {
        this.logger = new common_1.Logger(GeminiProvider.name);
        this.model = new google_genai_1.ChatGoogleGenerativeAI({
            apiKey: configService.get('GEMINI_API_KEY'),
            model: configService.get('GEMINI_MODEL', 'gemini-1.5-flash'),
            temperature: configService.get('GEMINI_TEMPERATURE', 0),
        });
        this.logger.log(`GeminiProvider initialized — model: ${configService.get('GEMINI_MODEL', 'gemini-1.5-flash')}`);
    }
    async generate(prompt) {
        try {
            const response = await this.model.invoke(prompt);
            return response.content;
        }
        catch (err) {
            this.logger.error(`Gemini generate failed: ${err.message}`);
            throw err;
        }
    }
    async generateStructured(prompt, schema, options, attachment) {
        try {
            const structured = this.model.withStructuredOutput(schema);
            if (attachment) {
                const message = new human_cjs_1.HumanMessage({
                    content: [
                        {
                            type: 'text',
                            text: prompt,
                        },
                        {
                            type: attachment.type === 'image' ? 'image_url' : 'media',
                            mimeType: attachment.mediaType,
                            data: attachment.data,
                        },
                    ],
                });
                const response = await structured.invoke([message]);
                return response;
            }
            const response = await structured.invoke(prompt);
            return response;
        }
        catch (err) {
            this.logger.error(`Gemini generateStructured failed: ${err.message}`);
            throw err;
        }
    }
}
exports.GeminiProvider = GeminiProvider;
//# sourceMappingURL=gemini.provider.js.map