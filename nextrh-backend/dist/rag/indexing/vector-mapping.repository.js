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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorMappingRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let VectorMappingRepository = class VectorMappingRepository {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async getOrCreateMappingId(userId, sourceTable, entityId, chunkIndex, generation) {
        const query = `
      INSERT INTO vector_mappings (user_id, source_table, entity_id, chunk_index, generation)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, source_table, entity_id, chunk_index, generation) 
      DO UPDATE SET indexed_at = NOW()
      RETURNING id;
    `;
        const res = await this.dbService.query(query, [userId, sourceTable, entityId, chunkIndex, generation]);
        return Number(res[0].id);
    }
    async getAllUserVectorPointIds(userId) {
        const query = `SELECT id FROM vector_mappings WHERE user_id = $1;`;
        const res = await this.dbService.query(query, [userId]);
        return res.map((row) => Number(row.id));
    }
    async deleteAllUserVectorMappings(userId) {
        const query = `DELETE FROM vector_mappings WHERE user_id = $1;`;
        await this.dbService.query(query, [userId]);
    }
    async clearAllVectorMappings() {
        await this.dbService.query(`TRUNCATE TABLE vector_mappings RESTART IDENTITY;`);
    }
    async deleteMappingsByIds(ids) {
        if (!ids || ids.length === 0) {
            return;
        }
        const query = `DELETE FROM vector_mappings WHERE id = ANY($1);`;
        await this.dbService.query(query, [ids]);
    }
    async getVectorPointIdsByGeneration(userId, generation) {
        const query = `SELECT id FROM vector_mappings WHERE user_id = $1 AND generation = $2;`;
        const res = await this.dbService.query(query, [userId, generation]);
        return res.map((row) => Number(row.id));
    }
    async deleteMappingsByGeneration(userId, generation) {
        const query = `DELETE FROM vector_mappings WHERE user_id = $1 AND generation = $2;`;
        await this.dbService.query(query, [userId, generation]);
    }
    async updateActiveGeneration(cvId, targetGen) {
        const query = `UPDATE cvs SET active_generation = $1 WHERE cv_id = $2;`;
        await this.dbService.query(query, [targetGen, cvId]);
    }
};
exports.VectorMappingRepository = VectorMappingRepository;
exports.VectorMappingRepository = VectorMappingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], VectorMappingRepository);
//# sourceMappingURL=vector-mapping.repository.js.map