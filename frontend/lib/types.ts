export interface PDFMetadata {
  page_count: number;
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creation_date: string;
  modification_date: string;
}

export interface ExtractedData {
  key_entities: string[];
  dates: string[];
  numbers: string[];
  topics: string[];
}

export interface Classification {
  document_type: string;
  industry: string;
  confidence: string;
}

export interface AnalysisResult {
  summary: string;
  extracted_data: ExtractedData;
  classification: Classification;
  key_insights: string[];
}

export interface PDFAnalysisResponse {
  file_id: string;
  filename: string;
  analysis: AnalysisResult;
  metadata: PDFMetadata;
  timestamp: string;
}

export interface ErrorResponse {
  detail: string;
  error?: string;
  timestamp: string;
}

export interface DeleteResponse {
  message: string;
  file_id: string;
  timestamp: string;
}
