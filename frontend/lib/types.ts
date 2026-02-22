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

export interface Coordinate {
  x: {
    left_x: string;
    right_x: string;
  };
  y: {
    lower_y: string;
    upper_y: string;
  };
}

export interface ExtractedElement {
  value: string;
  value_en?: string;  // English translation (optional)
  coordinate: Coordinate;
}

export interface Classification {
  document_type: string;
  industry: string;
  confidence: string;
}

export interface AnalysisResult {
  summary: string;
  classification: Classification;
  dimension: ExtractedElement[];
  annotation: ExtractedElement[];
  title_block: ExtractedElement[];
  others: ExtractedElement[];
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

export interface PageDimensions {
  width: number;           // Rendered width in pixels
  height: number;          // Rendered height in pixels
  originalWidth: number;   // Original PDF width in points
  originalHeight: number;  // Original PDF height in points
}

export interface ScreenCoordinates {
  left: number;
  top: number;
  width: number;
  height: number;
}
