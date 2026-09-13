import { readFile, writeFile } from 'node:fs/promises';

const assets = JSON.parse(
  await readFile(new URL('../public/images/manifest.json', import.meta.url), 'utf8'),
);
for (const asset of assets) {
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`${asset.name}: ${response.status}`);
  await writeFile(
    new URL(`../public${asset.src}`, import.meta.url),
    Buffer.from(await response.arrayBuffer()),
  );
  console.log(`Downloaded ${asset.name}`);
}
