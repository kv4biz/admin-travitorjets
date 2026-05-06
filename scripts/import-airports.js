//script/import-airports.js - Import airports from OpenFlights CSV to Supabase
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

const ALLOWED_SIZES = new Set([
  "small_airport",
  "medium_airport",
  "large_airport",
]);

const BATCH_SIZE = 500;

// ✅ STRICT VALIDATORS
function isValidICAO(code) {
  return /^[A-Z]{4}$/.test(code);
}

function isValidIATA(code) {
  return /^[A-Z]{3}$/.test(code);
}

function generateSlug(name, iata, icao) {
  const code = iata || icao;
  return `${name}-${code}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getLid(localCode, iata, icao, gpsCode) {
  if (localCode && localCode.trim()) return localCode.trim();
  if (iata && iata.trim()) return iata.trim();
  if (gpsCode && gpsCode.trim()) return gpsCode.trim();
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
        if (row.code && row.name) {
          map.set(row.code.trim(), { name: row.name.trim() });
        }
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
        if (row.code && row.name) {
          map.set(row.code.trim(), { name: row.name.trim() });
        }
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
    skippedSize: 0,
    invalidICAO: 0,
    invalidIATA: 0,
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

        const type = row.type?.trim();
        if (!ALLOWED_SIZES.has(type)) {
          stats.skippedSize++;
          return;
        }

        // ✅ ICAO (STRICT)
        let icao = row.icao_code?.trim() || row.ident?.trim();
        if (!icao || !isValidICAO(icao)) {
          stats.invalidICAO++;
          return;
        }

        // ✅ IATA (STRICT — NO FALLBACK)
        let iata = row.iata_code?.trim();
        if (!iata || !isValidIATA(iata)) {
          stats.invalidIATA++;
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
          if (region?.name) city = region.name;
        }

        const lid = getLid(row.local_code, iata, icao, row.gps_code);
        const slug = generateSlug(name, iata, icao);

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
          size: type,
          continent: row.continent?.trim() || null,
        });

        stats.valid++;
      })
      .on("end", resolve)
      .on("error", reject);
  });

  console.log("\n=== CLEAN DATA STATS ===");
  console.log(`Total rows:        ${stats.totalRows}`);
  console.log(`Skipped (size):    ${stats.skippedSize}`);
  console.log(`Invalid ICAO:      ${stats.invalidICAO}`);
  console.log(`Invalid IATA:      ${stats.invalidIATA}`);
  console.log(`Missing name:      ${stats.missingName}`);
  console.log(`Missing coords:    ${stats.missingCoords}`);
  console.log(`No country:        ${stats.noCountry}`);
  console.log(`Valid airports:    ${stats.valid}`);

  if (!airports.length) {
    console.log("No valid airports to insert.");
    return;
  }

  await clearAirports();

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < airports.length; i += BATCH_SIZE) {
    const batch = airports.slice(i, i + BATCH_SIZE);

    console.log(
      `Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length})`,
    );

    const { data, error } = await supabase
      .from("airports")
      .upsert(batch, { onConflict: "icao" })
      .select();

    if (error) {
      console.error(`❌ ${error.message}`);
      errors += batch.length;
    } else {
      inserted += data.length;
      console.log(`✅ Inserted ${data.length}`);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n=== FINAL ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Errors:   ${errors}`);
}

importAirports().catch(console.error);
