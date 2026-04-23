import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (extractor) return extractor;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2') as any;
  return extractor!;
}

export async function embed(text: string): Promise<number[]> {
  const model = await getExtractor();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export function buildTransactionEmbeddingText(t: {
  merchant: string | null;
  notes: string | null;
  direction: 'debit' | 'credit';
  amount: number;
  category_name?: string | null;
}): string {
  const parts: string[] = [];
  if (t.merchant) parts.push(t.merchant);
  if (t.category_name) parts.push(t.category_name);
  parts.push(t.direction === 'debit' ? 'spent' : 'received');
  parts.push(`${t.amount} rupees`);
  if (t.notes) parts.push(t.notes);
  return parts.join(' · ');
}
