import { writeFileSync } from 'fs';
import { prisma } from './prisma';

const industries = await prisma.industry.findMany({});

// Kill reasons tracking
const killReasons = {
  noData: 0,
  notEnoughSmallCompanies: 0,
  lowPayrollPerEmployee: 0,
  smallBizEconomicallyMarginal: 0,
  avgEstablishmentTooLarge: 0,
};

// Thresholds (tune these)
const MIN_SMALL_ESTABLISHMENTS = 10_000;
const MIN_PAYROLL_PER_EMPLOYEE = 30_000; // $30K/year
const MIN_SMALL_BIZ_PAYROLL_SHARE = 0.15; // 15% of industry payroll
const MAX_AVG_EMPLOYEES_PER_ESTABLISHMENT = 100;

const isSmallSize = (sizeCode: string) => {
  return ['210', '220', '230', '241'].includes(sizeCode);
};

const toLabel = (sizeCode: string) => {
  switch (sizeCode) {
    case '210':
      return '1-4';
    case '220':
      return '5-9';
    case '230':
      return '10-19';
    case '241':
      return '20-49';
    case '242':
      return '50-99';
    case '251':
      return '100-249';
    case '252':
      return '250-499';
    case '254':
      return '500-999';
    case '260':
      return '1000+';
    default:
      throw new Error(`Unknown size code: ${sizeCode}`);
  }
};

const survivors: Array<{
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
}> = [];

for (const { cbp, code, title, sector } of industries) {
  if (!cbp) {
    killReasons.noData++;
    continue;
  }

  const smallBizData = cbp.bySizeClass.filter((e) => isSmallSize(e.sizeCode));

  const numberOfSmallEstablishments = smallBizData.reduce(
    (sum, e) => sum + e.establishments,
    0
  );

  const smallBizPayroll =
    smallBizData.reduce((sum, e) => sum + e.annualPayroll, 0) * 1000; // Convert from $1,000 units

  const totalPayroll = cbp.total.annualPayroll * 1000;
  const totalEmployees = cbp.total.employees;
  const totalEstablishments = cbp.total.establishments;

  // Derived metrics
  const avgPayrollPerEmployee =
    totalEmployees > 0 ? totalPayroll / totalEmployees : 0;

  const smallBizPayrollShare =
    totalPayroll > 0 ? smallBizPayroll / totalPayroll : 0;

  const avgEmployeesPerEstablishment =
    totalEstablishments > 0 ? totalEmployees / totalEstablishments : 0;

  // Filter 1: Not enough small companies
  if (numberOfSmallEstablishments < MIN_SMALL_ESTABLISHMENTS) {
    killReasons.notEnoughSmallCompanies++;
    continue;
  }

  // Filter 2: Low payroll per employee (poor industry)
  if (avgPayrollPerEmployee < MIN_PAYROLL_PER_EMPLOYEE) {
    killReasons.lowPayrollPerEmployee++;
    continue;
  }

  // Filter 3: Small businesses are economically marginal
  if (smallBizPayrollShare < MIN_SMALL_BIZ_PAYROLL_SHARE) {
    killReasons.smallBizEconomicallyMarginal++;
    continue;
  }

  // Filter 4: Average establishment too large (industry favors scale)
  if (avgEmployeesPerEstablishment > MAX_AVG_EMPLOYEES_PER_ESTABLISHMENT) {
    killReasons.avgEstablishmentTooLarge++;
    continue;
  }

  const sizeBreakdown = cbp.bySizeClass
    .map(
      ({ sizeCode, establishments, employees }) =>
        `${toLabel(
          sizeCode
        )}: ${establishments.toLocaleString()} est. (${employees.toLocaleString()} emp)`
    )
    .join(' | ');

  survivors.push({
    code,
    title,
    sector,
    metrics: {
      smallEstablishments: numberOfSmallEstablishments,
      totalEstablishments,
      totalEmployees,
      avgPayrollPerEmployee: Math.round(avgPayrollPerEmployee),
      smallBizPayrollShare: Math.round(smallBizPayrollShare * 100) / 100,
      avgEmployeesPerEstablishment:
        Math.round(avgEmployeesPerEstablishment * 10) / 10,
    },
    sizeBreakdown,
  });
}

// Sort survivors by small establishments (most fragmented first)
survivors.sort(
  (a, b) => b.metrics.smallEstablishments - a.metrics.smallEstablishments
);

// Output
console.log('\n=== KILL SUMMARY ===');
console.log(`No data: ${killReasons.noData}`);
console.log(
  `Not enough small companies (<${MIN_SMALL_ESTABLISHMENTS.toLocaleString()}): ${
    killReasons.notEnoughSmallCompanies
  }`
);
console.log(
  `Low payroll/employee (<$${MIN_PAYROLL_PER_EMPLOYEE.toLocaleString()}): ${
    killReasons.lowPayrollPerEmployee
  }`
);
console.log(
  `Small biz economically marginal (<${
    MIN_SMALL_BIZ_PAYROLL_SHARE * 100
  }% of payroll): ${killReasons.smallBizEconomicallyMarginal}`
);
console.log(
  `Avg establishment too large (>${MAX_AVG_EMPLOYEES_PER_ESTABLISHMENT} employees): ${killReasons.avgEstablishmentTooLarge}`
);
console.log(`\n=== SURVIVORS: ${survivors.length} ===\n`);

// Human-readable output
const readableOutput = survivors
  .map(
    (s, i) =>
      `${i + 1}. ${s.code} - ${s.title}
   Sector: ${s.sector}
   Small Establishments: ${s.metrics.smallEstablishments.toLocaleString()}
   Avg Payroll/Employee: $${s.metrics.avgPayrollPerEmployee.toLocaleString()}
   Small Biz Payroll Share: ${Math.round(s.metrics.smallBizPayrollShare * 100)}%
   Avg Employees/Establishment: ${s.metrics.avgEmployeesPerEstablishment}
   Size Breakdown: ${s.sizeBreakdown}
`
  )
  .join('\n');

writeFileSync(
  '/Users/ches/projects/business/src/db/filteredIndustries.txt',
  readableOutput,
  'utf-8'
);

// JSON for further processing
writeFileSync(
  '/Users/ches/projects/business/src/db/filteredIndustries.json',
  JSON.stringify(survivors, null, 2),
  'utf-8'
);

console.log('Files written.');
