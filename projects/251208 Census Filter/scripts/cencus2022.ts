import { PrismaClient } from "@prisma/client";
import { CENSUS_API_KEY } from "../env.js";

const CBP_BASE_URL = "https://api.census.gov/data/2022/cbp";
const CBP_YEAR = 2022;

const prisma = new PrismaClient();

type RawRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
];

interface EstablishmentData {
  sizeCode: string;
  sizeLabel: string;
  establishments: number;
  employees: number;
  annualPayroll: number;
  q1Payroll: number;
}

async function fetchFromCensus(naicsCode: string) {
  const params = new URLSearchParams({
    get: "ESTAB,EMP,PAYANN,PAYQTR1,EMPSZES,EMPSZES_LABEL,NAICS2017_LABEL",
    for: "us:*",
    NAICS2017: naicsCode,
    LFO: "001",
    key: CENSUS_API_KEY,
  });

  const response = await fetch(`${CBP_BASE_URL}?${params.toString()}`);

  if (response.status === 204) {
    throw new Error(`No data for NAICS ${naicsCode} (excluded from CBP)`);
  }
  if (response.status === 429) {
    throw new Error("Rate limit exceeded");
  }
  if (!response.ok) {
    throw new Error(`Census API error: ${response.status}`);
  }

  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`No data for NAICS ${naicsCode}`);
  }

  const data: string[][] = JSON.parse(text);
  if (data.length < 2) {
    throw new Error(`No data for NAICS ${naicsCode}`);
  }

  const rows = data.slice(1) as RawRow[];

  const all: EstablishmentData[] = rows.map((row) => ({
    sizeCode: row[4],
    sizeLabel: row[5],
    establishments: parseInt(row[0], 10) || 0,
    employees: parseInt(row[1], 10) || 0,
    annualPayroll: parseInt(row[2], 10) || 0,
    q1Payroll: parseInt(row[3], 10) || 0,
  }));

  const total = all.find((e) => e.sizeCode === "001");
  if (!total) {
    throw new Error(`No total row for NAICS ${naicsCode}`);
  }

  return {
    year: CBP_YEAR,
    fetchedAt: new Date(),
    total,
    bySizeClass: all.filter((e) => e.sizeCode !== "001"),
  };
}

export async function ensureCBPData(code: string): Promise<string> {
  const industry = await prisma.industry.findUnique({
    where: { code },
    select: { cbp: true, cbpError: true },
  });

  if (!industry) {
    return `Industry ${code} not found in database`;
  }

  if (industry.cbp) {
    return `CBP data already cached for ${code}`;
  }

  if (industry.cbpError) {
    return `CBP data unavailable for ${code}: ${industry.cbpError}`;
  }

  try {
    const cbp = await fetchFromCensus(code);

    await prisma.industry.update({
      where: { code },
      data: { cbp },
    });

    return `Fetched and saved CBP data for ${code}`;
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";

    await prisma.industry.update({
      where: { code },
      data: { cbpError: error },
    });

    return `CBP data unavailable for ${code}: ${error}`;
  }
}

const codes = await prisma.industry
  .findMany({ where: { cbp: { isSet: false }, cbpError: { isSet: false } } })
  .then((c) => c.map((i) => i.code));

console.log(`Start populating ${codes.length} industries...`);

for (let code of codes) {
  console.log(code, "...");
  const res = await ensureCBPData(code);
  console.log(res);
  await new Promise((resolve) => setTimeout(resolve, 100));
}
