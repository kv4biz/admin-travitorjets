import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = "https://pwykikhlivksuffdjhcm.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eWtpa2hsaXZrc3VmZmRqaGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEzMzczNCwiZXhwIjoyMDkwNzA5NzM0fQ.tTkHnOWbU0f9osn4gcJPX1tSkfx_CzkKvxubVa5mCFg";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALLOWED_TYPES = new Set([
  "small_airport",
  "medium_airport",
  "large_airport",
]);
const BATCH_SIZE = 500;

// Generate slug from name + IATA (or ICAO)
function generateSlug(name, iata, icao) {
  let base = name;
  const code = iata || icao;
  if (code) {
    base = `${name}-${code}`;
  }
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Determine lid: use local_code if present, else iata, else icao, else null
function getLid(localCode, iata, icao) {
  if (localCode && localCode.trim()) return localCode.trim();
  if (iata && iata.trim()) return iata.trim();
  if (icao) return icao;
  return null;
}

async function loadCountries() {
  const map = new Map();
  const filePath = path.join(__dirname, "../data/countries.csv");
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.code && row.name) map.set(row.code, { name: row.name });
      })
      .on("end", () => resolve(map))
      .on("error", reject);
  });
}

async function loadRegions() {
  const map = new Map();
  const filePath = path.join(__dirname, "../data/regions.csv");
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.code && row.name) map.set(row.code, { name: row.name });
      })
      .on("end", () => resolve(map))
      .on("error", reject);
  });
}

async function clearAirports() {
  console.log("Clearing existing airports...");
  const { error } = await supabase
    .from("airports")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
  console.log("Airports table cleared.");
}

async function importAirports() {
  console.log("Loading countries...");
  const countriesMap = await loadCountries();
  console.log("Loading regions...");
  const regionsMap = await loadRegions();

  console.log("Reading airports.csv...");
  const airports = [];
  const stats = {
    totalRows: 0,
    skippedType: 0,
    missingIcao: 0,
    missingName: 0,
    missingCoords: 0,
    noCountry: 0,
    valid: 0,
  };

  const airportsPath = path.join(__dirname, "../data/airports.csv");
  await new Promise((resolve, reject) => {
    fs.createReadStream(airportsPath)
      .pipe(csv())
      .on("data", (row) => {
        stats.totalRows++;
        if (!ALLOWED_TYPES.has(row.type)) {
          stats.skippedType++;
          return;
        }
        const icao = row.icao_code?.trim();
        if (!icao) {
          stats.missingIcao++;
          return;
        }
        const name = row.name?.trim();
        if (!name) {
          stats.missingName++;
          return;
        }
        const isoCountry = row.iso_country?.trim();
        const countryInfo = countriesMap.get(isoCountry);
        if (!countryInfo) {
          stats.noCountry++;
          return;
        }
        const lat = parseFloat(row.latitude_deg);
        const lon = parseFloat(row.longitude_deg);
        if (isNaN(lat) || isNaN(lon)) {
          stats.missingCoords++;
          return;
        }

        let city = row.municipality?.trim() || null;
        if (!city && row.iso_region) {
          const region = regionsMap.get(row.iso_region);
          if (region && region.name) city = region.name;
        }

        const iata = row.iata_code?.trim() || null;
        const lid = getLid(row.local_code, iata, icao);
        const slug = generateSlug(name, iata, icao);

        stats.valid++;
        airports.push({
          icao,
          iata,
          lid,
          name,
          slug,
          city,
          country: countryInfo.name,
          country_code: isoCountry,
          latitude: lat,
          longitude: lon,
        });
      })
      .on("end", resolve)
      .on("error", reject);
  });

  console.log("=== Statistics ===");
  console.log(`Total rows read:      ${stats.totalRows}`);
  console.log(`Skipped (type):       ${stats.skippedType}`);
  console.log(`Missing ICAO:         ${stats.missingIcao}`);
  console.log(`Missing Name:         ${stats.missingName}`);
  console.log(`Missing coordinates:  ${stats.missingCoords}`);
  console.log(`No country mapping:   ${stats.noCountry}`);
  console.log(`Valid airports:       ${stats.valid}`);

  if (airports.length === 0) {
    console.log("No valid airports to insert. Exiting.");
    return;
  }

  await clearAirports();

  let inserted = 0,
    errors = 0;
  for (let i = 0; i < airports.length; i += BATCH_SIZE) {
    const batch = airports.slice(i, i + BATCH_SIZE);
    console.log(
      `Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} rows)...`,
    );
    const { data, error } = await supabase
      .from("airports")
      .upsert(batch, { onConflict: "icao", ignoreDuplicates: false })
      .select();
    if (error) {
      console.error(`  ❌ Batch error: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += data.length;
      console.log(`  ✅ Inserted ${data.length} rows`);
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\n=== Final ===\nInserted: ${inserted}\nErrors: ${errors}`);
}

importAirports().catch(console.error);
