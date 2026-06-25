import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { RagPipelineService } from "./rag-pipeline.service";


@Injectable()
export class RagOrchestratorService {
  constructor(
     @Inject(forwardRef(() => RagPipelineService)) // 2. Add this decorator
    private pipeline: RagPipelineService,
  
  ) {}

  async ask(question: string) {
    return this.pipeline.run(question);
  }
   
 }