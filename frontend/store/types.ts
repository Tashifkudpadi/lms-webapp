export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  last_active: string | null;
}

export interface Student {
  id: number;
  user_id: number;
  name: string;
  email: string;
  batch_id: number;
  batch_name: string;
}

export interface Batch {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

export interface Faculty {
  id: number;
  user_id: number;
  name: string;
  email: string;
  subjects: string[];
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  faculty_name: string | null;
}
