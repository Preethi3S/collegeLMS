export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'student';
  year?: number;
  profileImage?: string;
  enrolledCourses?: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  instructor: User;
  targetYear: number;
  levels: Level[];
  students: string[];
}

export interface Level {
  id: string;
  title: string;
  description: string;
  order: number;
  modules: Module[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  order: number;
  resources: Resource[];
}

export interface Resource {
  title: string;
  fileUrl: string;
  fileType: string;
}

export interface Progress {
  student: string;
  course: string;
  completedModules: {
    moduleId: string;
    completedAt: string;
  }[];
  currentLevel: number;
  currentModule: number;
  startedAt: string;
  lastAccessedAt: string;
}

export interface Message {
  id: string;
  sender: User;
  receiver: User;
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}