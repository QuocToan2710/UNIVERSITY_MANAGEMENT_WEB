export type TuitionStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";

export interface TuitionItem {
  subjectClassId?: number;
  subjectClassCode: string;
  subjectClassName: string;
  subjectCode: string;
  subjectName: string;
  credit: number;
  pricePerCredit: number;
  totalAmount: number;
  enrolledAt?: string;
  status: string;
}

export interface StudentTuitionSummary {
  tuitionFeeId: number;
  studentId: number;
  studentCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  classGroupId?: number;
  classGroupCode?: string;
  classGroupName?: string;
  majorName?: string;
  semester: string;
  academicYear: string;
  totalCredits: number;
  pricePerCredit: number;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate?: string;
  status: TuitionStatus;
  statusDescription?: string;
  notes?: string;
  items: TuitionItem[];
}

export interface TuitionDashboardSummary {
  semester: string;
  academicYear: string;
  totalStudents: number;
  totalCreditsEnrolled: number;
  totalTuitionExpected: number;
  totalTuitionDiscount: number;
  totalTuitionCollected: number;
  totalTuitionDebt: number;
  collectionRatePercent: number;
  paidCount: number;
  partiallyPaidCount: number;
  unpaidCount: number;
  overdueCount: number;
}

export interface RecordPaymentPayload {
  studentId: number;
  semester?: string;
  academicYear?: string;
  paymentAmount: number;
  discountAmount?: number;
  dueDate?: string;
  paymentMethod?: string;
  transactionReference?: string;
  note?: string;
}