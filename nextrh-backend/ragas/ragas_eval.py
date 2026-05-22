import os
import json
from openai import OpenAI
from ragas import evaluate

# Import standard metrics
from ragas.metrics import Faithfulness, AnswerRelevancy
from ragas.llms import llm_factory

# FIX: Import the direct, stable LangChain Ollama driver for embeddings
from langchain_ollama import OllamaEmbeddings
from ragas.embeddings import LangchainEmbeddingsWrapper

from datasets import Dataset
import pandas as pd

DATASET_PATH = r"C:\Users\sedki\Desktop\NextRH\nextrh-backend\src\modules\evaluation\datasets\rag_dataset.json"

def load_nestjs_dataset(file_path):
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found at:\n   {file_path}")
        return None

    with open(file_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    if not raw_data:
        print("⚠️ Dataset file is empty.")
        return None

    questions = []
    contexts_list = []
    answers = []

    for entry in raw_data:
        questions.append(entry.get("question", ""))
        answers.append(entry.get("answer", ""))
        
        ctx = entry.get("contexts", [])
        if isinstance(ctx, str):
            contexts_list.append([ctx])
        else:
            contexts_list.append(ctx)

    return Dataset.from_dict({
        "question": questions,
        "contexts": contexts_list,
        "answer": answers
    })

if __name__ == "__main__":
    print(f"📂 Loading data from: {DATASET_PATH}...")
    dataset = load_nestjs_dataset(DATASET_PATH)

    if dataset:
        print(f"📊 Loaded {len(dataset)} evaluation samples.")
        print("🤖 Initializing stable local connection wrappers...")
        
        # 1. LLM via OpenAI Bridge (This part works well)
        ollama_client = OpenAI(
            api_key="ollama-local", 
            base_url="http://localhost:11434/v1"
        )
        local_llm = llm_factory(
            model="qwen2.5:7b", 
            provider="openai", 
            client=ollama_client
        )
        
        # 2. FIX: Use standard OllamaEmbeddings wrapped explicitly for Ragas
        # This completely avoids the broken internal OpenAIEmbeddings.embed_query code path
        base_embeddings = OllamaEmbeddings(
            model="nomic-embed-text",
            base_url="http://localhost:11434"
        )
        local_embeddings = LangchainEmbeddingsWrapper(base_embeddings)

        # Build your testing metrics array
        metrics = [
            Faithfulness(llm=local_llm),
            AnswerRelevancy(llm=local_llm, embeddings=local_embeddings)
        ]

        print("🔄 Computing RAGAS metrics locally... (Processing tokens via Ollama)")
        result = evaluate(
            dataset,
            metrics=metrics,
            llm=local_llm,
            embeddings=local_embeddings
        )

        df = result.to_pandas()
        print("\n🏆 --- EVALUATION COMPLETED ---")
        print(df)

        output_csv = os.path.join(os.path.dirname(__file__), "pfe_ragas_metrics.csv")
        df.to_csv(output_csv, index=False)
        print(f"\n💾 Matrix exported to '{output_csv}'")