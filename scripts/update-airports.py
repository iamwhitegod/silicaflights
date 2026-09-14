"""Import a public-domain OurAirports snapshot; no network requests at app runtime."""
import argparse
import csv
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

SOURCE = 'https://davidmegginson.github.io/ourairports-data/airports.csv'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--input', type=Path, help='Use an already downloaded airports.csv')
args = parser.parse_args()
raw = args.input.read_bytes() if args.input else urlopen(SOURCE, timeout=60).read()
airports = {}
for row in csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))):
    code = row['iata_code']
    if len(code) != 3 or not code.isascii() or not code.isalpha() or not code.isupper():
        continue
    if row['type'] not in ('small_airport', 'medium_airport', 'large_airport'):
        continue
    item = [code, row['name'], row['municipality'], row['iso_country'], row['iso_region'], row['scheduled_service'] == 'yes', row['type']]
    previous = airports.get(code)
    if previous is None or (item[5], item[6] == 'large_airport') > (previous[5], previous[6] == 'large_airport'):
        airports[code] = item
if len(airports) < 5000 or not {'LOS', 'ABV', 'PHC', 'LHR', 'JFK'}.issubset(airports):
    raise SystemExit('Incomplete airport catalog; existing snapshot was not changed.')
result = {
    'source': SOURCE,
    'license': 'Public domain — https://ourairports.com/data/',
    'retrievedOn': datetime.now(timezone.utc).date().isoformat(),
    'sha256': hashlib.sha256(raw).hexdigest(),
    'fields': ['code', 'name', 'city', 'country', 'region', 'scheduled', 'type'],
    'airports': [airports[k] for k in sorted(airports)],
}
target = Path(__file__).resolve().parents[1] / 'src/data/airport-catalog.json'
target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'Imported {len(airports)} airports from OurAirports.')
