"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IndexingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const employeeProfile_service_1 = require("../../Employee/employeeProfile.service");
const embedding_service_1 = require("../embedding/embedding.service");
const vector_service_1 = require("../vector/vector.service");
const chunking_service_1 = require("../chunking/chunking.service");
const vector_mapping_repository_1 = require("./vector-mapping.repository");
const CHUNK_TYPES = ['profile', 'projects', 'credentials'];
let IndexingService = IndexingService_1 = class IndexingService {
    constructor(configService, employeeProfileService, embeddingService, vectorService, chunkingService, mappingRepository) {
        this.configService = configService;
        this.employeeProfileService = employeeProfileService;
        this.embeddingService = embeddingService;
        this.vectorService = vectorService;
        this.chunkingService = chunkingService;
        this.mappingRepository = mappingRepository;
        this.logger = new common_1.Logger(IndexingService_1.name);
    }
    async reindexUser(userId) {
        if (!userId) {
            this.logger.error('reindexUser called with no userId');
            return { points: 0, status: 'error', error: 'missing userId' };
        }
        try {
            const [cv, experiences, educations, projects, certifications, trainings] = await Promise.all([
                this.employeeProfileService.getCVByUserId(userId),
                this.employeeProfileService.getExperiencesByUserId(userId),
                this.employeeProfileService.getEducationByUserId(userId),
                this.employeeProfileService.getProjectsByUserId(userId),
                this.employeeProfileService.getCertificationsByUserId(userId),
                this.employeeProfileService.getTrainingsByUserId(userId),
            ]);
            if (!cv) {
                this.logger.warn(`No active profile found for user #${userId}`);
                return { points: 0, status: 'no_profile' };
            }
            const profile = {
                cv_id: cv.cv_id,
                full_name: cv.full_name,
                profession: cv.profession,
                email: cv.email,
                address: cv.address,
                skills: cv.skills,
                educations,
                experiences,
                projects,
                certifications,
                trainings,
            };
            const chunks = this.chunkingService.chunkCandidate(profile);
            if (chunks.length === 0) {
                this.logger.warn(`No chunks produced for user #${userId}`);
                return { points: 0, status: 'no_profile' };
            }
            const currentGen = cv.active_generation || 1;
            const targetGen = currentGen === 1 ? 2 : 1;
            const newPoints = await this.embedChunks(chunks, userId, cv.full_name, cv.cv_id, targetGen);
            this.logger.log(`[DEBUG-QDRANT] Ready to insert point example: ID=${newPoints[0]?.id}, VectorLength=${newPoints[0]?.vector?.length}`);
            const oldPointIds = await this.mappingRepository.getVectorPointIdsByGeneration(userId, currentGen);
            try {
                await this.insertWithRetry(newPoints);
            }
            catch (err) {
                this.logger.error(`Insert failed for user #${userId} on targetGen ${targetGen}. Old index preserved.`);
                await this.mappingRepository.deleteMappingsByGeneration(userId, targetGen).catch(delErr => {
                    this.logger.warn(`Orphan mappings cleanup failed for user #${userId}: ${delErr.message}`);
                });
                return { points: 0, status: 'error', error: err.message };
            }
            await this.mappingRepository.updateActiveGeneration(cv.cv_id, targetGen);
            if (oldPointIds.length > 0) {
                await Promise.all([
                    this.deleteWithRetry(oldPointIds),
                    this.mappingRepository.deleteMappingsByGeneration(userId, currentGen),
                ]).catch(err => {
                    this.logger.warn(`Old generation ${currentGen} cleanup failed for user #${userId}: ${err.message}`);
                });
            }
            this.logger.log(`User #${userId} indexed: ${newPoints.length} vectors on Gen ${targetGen}`);
            return { points: newPoints.length, status: 'success' };
        }
        catch (err) {
            this.logger.error(`Re-indexing failed for user #${userId}: ${err.message}`);
            return { points: 0, status: 'error', error: err.message };
        }
    }
    async indexAllCVs() {
        this.logger.log('Starting full database re-indexing...');
        await this.vectorService.recreateCollection();
        await this.mappingRepository.clearAllVectorMappings();
        this.logger.log('Collection and mapping tables cleared.');
        const cvs = await this.employeeProfileService.getAllCVs();
        let totalPointsCount = 0;
        const failedUsers = [];
        const userDelayMs = this.configService.get('INDEXING_USER_DELAY_MS', 0);
        for (let i = 0; i < cvs.length; i++) {
            const cv = cvs[i];
            if (!cv.user_id)
                continue;
            const result = await this.reindexUser(cv.user_id);
            if (result.status === 'success') {
                totalPointsCount += result.points;
            }
            else if (result.status === 'error') {
                failedUsers.push(cv.user_id);
            }
            if (userDelayMs > 0 && i < cvs.length - 1) {
                this.logger.debug(`Waiting ${userDelayMs}ms before processing next user...`);
                await new Promise(resolve => setTimeout(resolve, userDelayMs));
            }
        }
        if (failedUsers.length > 0) {
            this.logger.warn(`Indexing completed with ${failedUsers.length} failures: [${failedUsers.join(', ')}]`);
        }
        this.logger.log(`Full index complete: ${cvs.length} users, ${totalPointsCount} vectors, ${failedUsers.length} failures.`);
        return { totalUsers: cvs.length, totalPoints: totalPointsCount, failedUsers };
    }
    async embedChunks(chunks, userId, fullName, cvId, targetGen) {
        return Promise.all(chunks.map(async (chunk) => {
            const chunkType = CHUNK_TYPES[chunk.chunkIndex] ?? 'profile';
            const sourceTable = this.mapTypeToTable(chunkType);
            const [vector, sequentialId] = await Promise.all([
                this.embeddingService.embed(chunk.text),
                this.mappingRepository.getOrCreateMappingId(userId, sourceTable, cvId, chunk.chunkIndex, targetGen),
            ]);
            return {
                id: sequentialId,
                vector,
                payload: {
                    text: chunk.text,
                    type: chunkType,
                    user_id: userId,
                    entity_id: cvId,
                    full_name: fullName,
                    source_table: sourceTable,
                    generation: targetGen,
                    indexed_at: new Date().toISOString(),
                },
            };
        }));
    }
    async insertWithRetry(points, retries = 3, delay = 2000) {
        for (let i = 0; i < retries; i++) {
            try {
                await this.vectorService.insertBatch(points);
                return;
            }
            catch (err) {
                if (i === retries - 1)
                    throw err;
                this.logger.warn(`Vector insert failed (attempt ${i + 1}/${retries}): ${err.message}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    async deleteWithRetry(pointIds, retries = 3, delay = 2000) {
        for (let i = 0; i < retries; i++) {
            try {
                await this.vectorService.deletePointsBatch(pointIds);
                return;
            }
            catch (err) {
                if (i === retries - 1)
                    throw err;
                this.logger.warn(`Vector delete failed (attempt ${i + 1}/${retries}): ${err.message}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    mapTypeToTable(type) {
        const mapping = {
            profile: 'cvs,educations,experiences',
            projects: 'projects',
            credentials: 'certifications,trainings',
        };
        return mapping[type] ?? 'unknown';
    }
};
exports.IndexingService = IndexingService;
exports.IndexingService = IndexingService = IndexingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        employeeProfile_service_1.EmployeeProfileService,
        embedding_service_1.EmbeddingService,
        vector_service_1.VectorService,
        chunking_service_1.ChunkingService,
        vector_mapping_repository_1.VectorMappingRepository])
], IndexingService);
//# sourceMappingURL=indexing.service.js.map