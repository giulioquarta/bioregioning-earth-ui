import { Client } from '@notionhq/client';
import fs from 'fs';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = '3331441510e18010a3b2d72945d092ea';

async function main() {
  const response = await notion.databases.query({
    database_id: databaseId,
    page_size: 10,
  });

  const dump = [];

  for (const page of response.results) {
    const entry = { id: page.id, url: page.url, properties: {} };
    for (const [key, value] of Object.entries(page.properties)) {
      entry.properties[key] = {
        type: value.type,
        raw: value[value.type],
      };
    }
    dump.push(entry);
  }

  const outPath = './scripts/debug-notion-output.json';
  fs.writeFileSync(outPath, JSON.stringify(dump, null, 2));
  console.log(`Wrote ${dump.length} records to ${outPath}`);

  // Also print a compact summary to stdout
  for (const entry of dump.slice(0, 3)) {
    console.log('\n=== Record:', entry.id, '===');
    for (const [key, value] of Object.entries(entry.properties)) {
      const rawStr = JSON.stringify(value.raw).slice(0, 200);
      console.log(`  ${key} (${value.type}): ${rawStr}`);
    }
  }
}

main().catch(console.error);
