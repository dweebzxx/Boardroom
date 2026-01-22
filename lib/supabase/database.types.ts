export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          code: string;
          name: string;
          instructor: string;
          term: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          instructor: string;
          term: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          instructor?: string;
          term?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      schedule_items: {
        Row: {
          id: string;
          course_id: string;
          date: string;
          type: string;
          title: string;
          due_time: string;
          is_major: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          date: string;
          type: string;
          title: string;
          due_time?: string;
          is_major?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string;
          date?: string;
          type?: string;
          title?: string;
          due_time?: string;
          is_major?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          course_id: string | null;
          title: string;
          source: string | null;
          storage_path: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          course_id?: string | null;
          title: string;
          source?: string | null;
          storage_path?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string | null;
          title?: string;
          source?: string | null;
          storage_path?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          embedding: number[];
          metadata: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          chunk_index: number;
          content: string;
          embedding: number[];
          metadata?: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          document_id?: string;
          chunk_index?: number;
          content?: string;
          embedding?: number[];
          metadata?: Json;
          created_at?: string | null;
        };
        Relationships: [];
      };
      ingestion_jobs: {
        Row: {
          id: string;
          document_id: string | null;
          status: string;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          document_id?: string | null;
          status: string;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          document_id?: string | null;
          status?: string;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      debates: {
        Row: {
          id: string;
          course_id: string;
          topic: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          topic: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string;
          topic?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      debate_messages: {
        Row: {
          id: string;
          debate_id: string;
          role: 'analyst' | 'strategist' | 'professor' | 'ceo';
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          debate_id: string;
          role: 'analyst' | 'strategist' | 'professor' | 'ceo';
          content: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          debate_id?: string;
          role?: 'analyst' | 'strategist' | 'professor' | 'ceo';
          content?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      executive_briefs: {
        Row: {
          id: string;
          debate_id: string | null;
          course_id: string;
          topic: string | null;
          content: string;
          content_markdown: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          debate_id?: string | null;
          course_id: string;
          topic?: string | null;
          content?: string;
          content_markdown?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          debate_id?: string | null;
          course_id?: string;
          topic?: string | null;
          content?: string;
          content_markdown?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
