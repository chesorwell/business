# Census Bureau County Business Patterns (CBP) API Reference

## Quick Start

Get establishment count for a NAICS code (nationwide):

```
https://api.census.gov/data/2022/cbp?get=ESTAB,NAICS2017_LABEL&for=us:*&NAICS2017=541511&LFO=001&EMPSZES=001
```

Returns: `[["ESTAB","NAICS2017_LABEL","..."],["68038","Custom computer programming services","..."]]`

---

## Base URL Structure

```
https://api.census.gov/data/{YEAR}/cbp?get={VARIABLES}&for={GEOGRAPHY}&{FILTERS}
```

| Component | Description |
|-----------|-------------|
| `{YEAR}` | Data year (1986-2022 available) |
| `{VARIABLES}` | Comma-separated list of data fields to return |
| `{GEOGRAPHY}` | Geographic level and scope |
| `{FILTERS}` | Required filter parameters |

---

## Variables (What You Can Request)

| Variable | Description | Type |
|----------|-------------|------|
| `ESTAB` | **Number of establishments** | int |
| `EMP` | Number of employees | int |
| `PAYANN` | Annual payroll ($1,000) | int |
| `PAYQTR1` | First-quarter payroll ($1,000) | int |
| `NAICS2017_LABEL` | Industry name/description | string |
| `NAME` | Geography name | string |

---

## Required Filters

### 1. NAICS2017 (Industry Code)

The industry you want data for. Use 2017 NAICS codes.

| Code Format | Example | Meaning |
|-------------|---------|---------|
| `00` | `NAICS2017=00` | All industries total |
| 2-digit | `NAICS2017=54` | Sector (Professional Services) |
| 3-digit | `NAICS2017=541` | Subsector |
| 4-digit | `NAICS2017=5415` | Industry group |
| 5-digit | `NAICS2017=54151` | Industry |
| 6-digit | `NAICS2017=541511` | National industry (most specific) |

### 2. LFO (Legal Form of Organization)

| Code | Meaning |
|------|---------|
| `001` | **All establishments** (use this for totals) |
| `9101` | C-corporations |
| `9111` | S-corporations |
| `920` | Individual proprietorships |
| `930` | Partnerships |
| `932` | Non-profit |
| `933` | Government |

### 3. EMPSZES (Employment Size Class)

| Code | Meaning |
|------|---------|
| `001` | **All establishments** (use this for totals) |
| `210` | Less than 5 employees |
| `220` | 5 to 9 employees |
| `230` | 10 to 19 employees |
| `241` | 20 to 49 employees |
| `242` | 50 to 99 employees |
| `251` | 100 to 249 employees |
| `252` | 250 to 499 employees |
| `254` | 500 to 999 employees |
| `260` | 1,000+ employees |

---

## Geography Options

### National (US Total)
```
for=us:*
```

### By State
```
for=state:*           # All states
for=state:06          # California only (FIPS code)
```

### By County
```
for=county:*                    # All counties
for=county:*&in=state:06        # All counties in California
for=county:037&in=state:06      # Los Angeles County, CA
```

### By Metro Area
```
for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:*
for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:31080   # LA metro
```

### By ZIP Code
```
for=zip%20code:*        # All ZIP codes
for=zip%20code:90210    # Specific ZIP
```

---

## Complete Examples

### Example 1: Total establishments for an industry nationwide
```bash
curl "https://api.census.gov/data/2022/cbp?get=ESTAB,NAICS2017_LABEL&for=us:*&NAICS2017=541511&LFO=001&EMPSZES=001"
```

### Example 2: Establishments by state
```bash
curl "https://api.census.gov/data/2022/cbp?get=NAME,ESTAB&for=state:*&NAICS2017=541511&LFO=001&EMPSZES=001"
```

### Example 3: Establishments with employee counts
```bash
curl "https://api.census.gov/data/2022/cbp?get=ESTAB,EMP,PAYANN,NAICS2017_LABEL&for=us:*&NAICS2017=541511&LFO=001&EMPSZES=001"
```

### Example 4: Breakdown by company size
```bash
# Get all size classes for an industry
curl "https://api.census.gov/data/2022/cbp?get=ESTAB,EMPSZES_LABEL&for=us:*&NAICS2017=541511&LFO=001"
```

### Example 5: Specific county
```bash
curl "https://api.census.gov/data/2022/cbp?get=ESTAB,NAME&for=county:037&in=state:06&NAICS2017=541511&LFO=001&EMPSZES=001"
```

---

## Response Format

The API returns JSON arrays. First row is headers, subsequent rows are data:

```json
[
  ["ESTAB","NAICS2017_LABEL","NAICS2017","LFO","EMPSZES","us"],
  ["68038","Custom computer programming services","541511","001","001","1"]
]
```

---

## Industries NOT Covered by CBP

CBP excludes these NAICS codes (use USDA Census of Agriculture instead):

| Excluded | NAICS Codes |
|----------|-------------|
| Crop Production | 111 |
| Animal Production | 112 |
| Rail Transportation | 482 |
| Postal Service | 491 |
| Certain Financial Funds | 525110, 525120, 525190, 525920 |
| Private Households | 814 |
| Public Administration | 92 |

---

## Query Limits

| Limit | Value |
|-------|-------|
| Variables per query | **50 max** |
| Requests per day (no key) | **500 per IP address** |
| Requests per day (with key) | Unlimited (but ~1,000/hour recommended) |

**Important:** If you're behind a corporate proxy/firewall, all employees share the same IP limit.

If you exceed limits → HTTP 429 error, wait ~1 hour.

---

## API Key (Optional but Recommended)

Request a free key at: https://api.census.gov/data/key_signup.html

Add to requests: `&key=YOUR_KEY_HERE`

---

## Output Formats

Default is JSON. To get CSV instead:

```
&outputFormat=csv
```

Example:
```bash
curl "https://api.census.gov/data/2022/cbp?get=ESTAB,NAICS2017_LABEL&for=us:*&NAICS2017=541511&LFO=001&EMPSZES=001&outputFormat=csv"
```

---

## Advanced: Wildcards in NAICS Codes

You can use wildcards (`*`) to get multiple industries at once:

```
&NAICS2017=23*    # All construction industries (codes starting with 23)
&NAICS2017=54*    # All professional services
```

---

## Advanced: Numeric Predicates

Filter by numeric ranges using colons:

```
&PAYANN=100000:500000    # Annual payroll between $100M and $500M
&EMP=50:999              # Establishments with 50-999 employees
```

---

## Quick Reference Card

**Simplest query for establishment count:**
```
https://api.census.gov/data/2022/cbp?get=ESTAB&for=us:*&NAICS2017={CODE}&LFO=001&EMPSZES=001
```

Replace `{CODE}` with your 6-digit NAICS code.

**Must include:**
- `NAICS2017` - the industry code
- `LFO=001` - all legal forms (required filter)
- `EMPSZES=001` - all sizes (required filter)
- `for=` - geography specification

---

## Resources

- API Discovery Tool: https://api.census.gov/data.html
- CBP Variables: https://api.census.gov/data/2022/cbp/variables.html
- CBP Examples: https://api.census.gov/data/2022/cbp/examples.html
- NAICS Lookup: https://www.census.gov/naics/
- Official API User Guide (PDF): https://www2.census.gov/data/api-documentation/api-user-guide.pdf
- Request API Key: https://api.census.gov/data/key_signup.html

---

## Contact

Questions? Email: census.data@census.gov
