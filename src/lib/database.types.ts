export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
        };
      };
      leaderboards: {
        Row: {
          id: string;
          name: string;
          description: string;
          public_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          public_id?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          public_id?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      activeness_boards: {
        Row: {
          id: string;
          name: string;
          description: string;
          public_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          public_id?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          public_id?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      module_scores: {
        Row: {
          id: string;
          board_id: string;
          student_name: string;
          module_number: number;
          activeness_score: number;
          notes: string;
          recorded_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          student_name: string;
          module_number: number;
          activeness_score: number;
          notes?: string;
          recorded_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          student_name?: string;
          module_number?: number;
          activeness_score?: number;
          notes?: string;
          recorded_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      interview_rounds: {
        Row: {
          id: string;
          leaderboard_id: string;
          student_name: string;
          round_number: number;
          score: number;
          interview_date: string;
          interviewer_name: string;
          strengths: string;
          weaknesses: string;
          feedback: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          leaderboard_id: string;
          student_name: string;
          round_number: number;
          score: number;
          interview_date: string;
          interviewer_name: string;
          strengths?: string;
          weaknesses?: string;
          feedback?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          leaderboard_id?: string;
          student_name?: string;
          round_number?: number;
          score?: number;
          interview_date?: string;
          interviewer_name?: string;
          strengths?: string;
          weaknesses?: string;
          feedback?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
