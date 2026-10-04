import type { UserRole } from '../types/api';

// حسابات الوضع التجريبي (VITE_USE_MOCK_API=true). أي كلمة مرور بتنفع -- مفيش باك إند
// بيتحقق منها. الملف ده عمدًا من غير أي imports تقيلة عشان صفحة الدخول تستورده مباشرة.
export interface MockAccount {
  username: string;
  fullName: string;
  role: UserRole;
  roleLabel: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  { username: 'storekeeper', fullName: 'Ahmed Hassan', role: 'Storekeeper', roleLabel: 'Storekeeper' },
  { username: 'production', fullName: 'Mona Adel', role: 'ProductionManager', roleLabel: 'Production Manager' },
  { username: 'lab', fullName: 'Omar Khaled', role: 'LabTech', roleLabel: 'Lab Technician' },
  { username: 'quality', fullName: 'Hana Samir', role: 'QualityManager', roleLabel: 'Quality Manager' },
  { username: 'manager', fullName: 'Youssef Nabil', role: 'GeneralManager', roleLabel: 'General Manager' },
  { username: 'admin', fullName: 'System Admin', role: 'SuperAdmin', roleLabel: 'Super Admin' },
];
