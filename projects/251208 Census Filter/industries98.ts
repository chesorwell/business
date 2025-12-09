import industriesData from "./industries98.json";

type Industry = {
  code: string;
  title: string;
  sector: string;
  metrics: {
    smallEstablishments: number;
    totalEstablishments: number;
    totalEmployees: number;
    avgPayrollPerEmployee: number;
    smallBizPayrollShare: number;
    avgEmployeesPerEstablishment: number;
  };
  sizeBreakdown: string;
};

// All 98 industries have :
// 1. At least 10,000 establishments with fewer than 50 employees
// 2. At least $30,000 payroll per employee
// 3. At least 15% payroll share from small businesses
// 4. At most 100 average employees per establishment

export const industries: Industry[] = industriesData as Industry[];
