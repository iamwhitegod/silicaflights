export async function loadAirports(query, signal) {
  const response = await fetch(`/api/airports?query=${encodeURIComponent(query)}`, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Airport search is unavailable.');

  return data.airports;
}
