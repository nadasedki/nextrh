import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
     

export interface RagSample {
  id: string;
  question: string;
  contexts: string[];
  answer: string;
  ground_truth?: string | null;
  metadata?: Record<string, any>;
  timestamp?: string;
}

@Injectable()
export class EvaluationService {
   
   private filePath = path.resolve(
    process.cwd(),
    'src/modules/evaluation/datasets/rag_dataset.json'
  );

  log(sample: RagSample) {
    let data: RagSample[] = [];

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        data = JSON.parse(raw || '[]');
      }
    } catch (err) {
      console.error('⚠️ Corrupted dataset file, resetting...');
      data = [];
    }

    const newEntry: RagSample = {
      ...sample,
      timestamp: new Date().toISOString(),
    };

    data.push(newEntry);

    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));

    console.log('📊 RAG sample logged');
  }
  //
  
  
   
}