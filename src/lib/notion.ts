import { Client } from '@notionhq/client';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

function getClient(): Client {
  const key = import.meta.env.NOTION_API_KEY;
  if (!key) throw new Error('NOTION_API_KEY is not set');
  return new Client({ auth: key });
}

export interface NormalizedRecord {
  id: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
  properties: Record<string, any>;
}

export interface SectionConfig {
  id: string;
  name: string;
  description: string;
  database_id: string | null;
  route: string;
  icon: string;
}

export function loadSectionConfig(): SectionConfig[] {
  const raw = fs.readFileSync('./src/data/databases.yaml', 'utf8');
  const parsed = yaml.load(raw) as { sections: SectionConfig[] };
  return parsed.sections;
}

export async function fetchSectionRecords(section: SectionConfig): Promise<NormalizedRecord[]> {
  if (!section.database_id) {
    console.warn(`Section "${section.id}" has no database_id configured; returning empty.`);
    return [];
  }
  return fetchDatabaseRecords(section.database_id);
}

export async function fetchDatabaseRecords(databaseId: string): Promise<NormalizedRecord[]> {
  const notion = getClient();
  const results: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });
    results.push(...response.results);
    cursor = response.next_cursor;
  } while (cursor);

  return results.map((page) => normalizePage(page));
}

function normalizePage(page: any): NormalizedRecord {
  const props = page.properties ?? {};
  return {
    id: page.id,
    url: page.url,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    properties: Object.fromEntries(
      Object.entries(props).map(([key, value]: [string, any]) => {
        return [key, extractValue(value)];
      })
    ),
  };
}

export function debugPropertyShape(prop: any): { type: string; valueType: string; hasLatLng: boolean } {
  const type = prop?.type ?? 'unknown';
  const raw = prop?.[type];
  const valueType = raw === null ? 'null' : Array.isArray(raw) ? 'array' : typeof raw;
  const hasLatLng = raw && typeof raw === 'object' && !Array.isArray(raw) && 'latitude' in raw && 'longitude' in raw;
  return { type, valueType, hasLatLng };
}

function extractValue(prop: any): any {
  switch (prop.type) {
    case 'title':
      return prop.title?.map((t: any) => t.plain_text).join('') ?? '';
    case 'rich_text':
      return prop.rich_text?.map((t: any) => t.plain_text).join('') ?? '';
    case 'select':
      return prop.select?.name ?? null;
    case 'multi_select':
      return prop.multi_select?.map((s: any) => s.name) ?? [];
    case 'number':
      return prop.number ?? null;
    case 'url':
      return prop.url ?? null;
    case 'email':
      return prop.email ?? null;
    case 'phone_number':
      return prop.phone_number ?? null;
    case 'checkbox':
      return prop.checkbox ?? false;
    case 'relation':
      return prop.relation?.map((r: any) => r.id) ?? [];
    case 'formula':
      return prop.formula?.[prop.formula.type] ?? null;
    case 'rollup':
      return prop.rollup?.array?.map(extractValue) ?? [];
    case 'date':
      return prop.date;
    case 'people':
      return prop.people?.map((p: any) => ({ id: p.id, name: p.name })) ?? [];
    case 'files':
      return prop.files?.map((f: any) => f.external?.url ?? f.file?.url) ?? [];
    case 'location':
      // Notion returns { latitude, longitude, address } or null
      return prop.location ?? null;
    default:
      // Unknown type — return small JSON preview so we can debug without crashing
      const raw = prop[prop.type];
      if (raw === undefined || raw === null) return raw;
      if (typeof raw === 'object') return raw;
      return raw;
  }
}
