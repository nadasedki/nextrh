"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FileStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let FileStorageService = FileStorageService_1 = class FileStorageService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(FileStorageService_1.name);
    }
    getTargetDirectory(category) {
        const envKey = category === 'certifications'
            ? 'UPLOAD_CERT_DESTINATION'
            : 'UPLOAD_DESTINATION';
        const configuredPath = this.configService.get(envKey) || `./uploads/${category}`;
        return path.isAbsolute(configuredPath)
            ? configuredPath
            : path.join(process.cwd(), configuredPath);
    }
    async saveFile(fileBuffer, originalName, prefix, category = 'cvs') {
        const targetDir = this.getTargetDirectory(category);
        await fs.mkdir(targetDir, { recursive: true });
        const ext = path.extname(originalName) || '.pdf';
        const fileName = `${prefix}-${Date.now()}${ext}`;
        const fullDiskPath = path.join(targetDir, fileName);
        await fs.writeFile(fullDiskPath, fileBuffer);
        const relativePath = path.join('uploads', category, fileName).replace(/\\/g, '/');
        this.logger.log(`File persisted: ${fullDiskPath}`);
        return { fullDiskPath, relativePath, fileName };
    }
    async deleteFile(relativePathOrFull, category = 'cvs') {
        if (!relativePathOrFull)
            return;
        try {
            const fileName = path.basename(relativePathOrFull);
            const targetDir = this.getTargetDirectory(category);
            const fullPath = path.join(targetDir, fileName);
            await fs.unlink(fullPath);
            this.logger.log(`File deleted: ${fullPath}`);
        }
        catch (err) {
            this.logger.warn(`Could not delete file (${relativePathOrFull}): ${err.message}`);
        }
    }
};
exports.FileStorageService = FileStorageService;
exports.FileStorageService = FileStorageService = FileStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FileStorageService);
//# sourceMappingURL=file-storage.service.js.map