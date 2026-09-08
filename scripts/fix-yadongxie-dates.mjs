#!/usr/bin/env node
/**
 * Yadong Xie's writing list embeds talk metadata in the same <p> as the date
 * (e.g. "@D2 2025 · 中文 · slides · Mar 9, 2025"). feed-me-up-scotty cannot
 * parse that with dateFormat, so it falls back to "now". This script rewrites
 * <updated> / retrieved from the last MMM d, yyyy found in each entry.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const XML_PATH = path.join(ROOT, "public", "yadongxie.xml");
const JSON_PATH = path.join(ROOT, "public", "yadongxie.json");
const ALL_XML_PATH = path.join(ROOT, "public", "all.xml");
const ALL_JSON_PATH = path.join(ROOT, "public", "all.json");

const MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};
const DATE_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})\b/g;

function parseListingDate(text) {
  const matches = [...String(text).matchAll(DATE_RE)];
  if (matches.length === 0) return null;
  const [, mon, day, year] = matches[matches.length - 1];
  const d = new Date(Date.UTC(Number(year), MONTHS[mon], Number(day)));
  return Number.isNaN(d.getTime()) ? null : d;
}

function stripTags(html) {
  return String(html)
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function fixXml(xml) {
  let fixed = 0;
  const out = xml.replace(/<entry>([\s\S]*?)<\/entry>/g, (block, body) => {
    const link = body.match(/<link href="([^"]+)"/)?.[1];
    const content = body.match(/<content\b[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? body;
    const date = parseListingDate(stripTags(content));
    if (!date || !link) return block;
    const iso = date.toISOString();
    fixed += 1;
    const nextBody = body.replace(
      /<updated>[\s\S]*?<\/updated>/,
      `<updated>${iso}</updated>`
    );
    return `<entry>${nextBody}</entry>`;
  });
  return { xml: out, fixed };
}

function fixJson(data) {
  let fixed = 0;
  for (const el of data.elements ?? []) {
    const date = parseListingDate(stripTags(el.contents ?? ""));
    if (!date) continue;
    el.retrieved = date.getTime();
    fixed += 1;
  }
  return fixed;
}

function fixAllXml(allXml, linkToIso) {
  return allXml.replace(/<entry>([\s\S]*?)<\/entry>/g, (block, body) => {
    const link = body.match(/<link href="([^"]+)"/)?.[1];
    if (!link || !linkToIso.has(link)) return block;
    const iso = linkToIso.get(link);
    const nextBody = body.replace(
      /<updated>[\s\S]*?<\/updated>/,
      `<updated>${iso}</updated>`
    );
    return `<entry>${nextBody}</entry>`;
  });
}

if (!fs.existsSync(XML_PATH)) {
  console.log(`skip: ${XML_PATH} not found`);
  process.exit(0);
}

const originalXml = fs.readFileSync(XML_PATH, "utf8");
const { xml, fixed } = fixXml(originalXml);
fs.writeFileSync(XML_PATH, xml);
console.log(`yadongxie.xml: updated ${fixed} entry dates`);

const linkToIso = new Map();
for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
  const body = m[1];
  const link = body.match(/<link href="([^"]+)"/)?.[1];
  const updated = body.match(/<updated>([^<]+)<\/updated>/)?.[1];
  if (link && updated) linkToIso.set(link, updated);
}

if (fs.existsSync(JSON_PATH)) {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  const n = fixJson(data);
  fs.writeFileSync(JSON_PATH, JSON.stringify(data));
  console.log(`yadongxie.json: updated ${n} retrieved timestamps`);
}

if (fs.existsSync(ALL_XML_PATH)) {
  const allXml = fs.readFileSync(ALL_XML_PATH, "utf8");
  fs.writeFileSync(ALL_XML_PATH, fixAllXml(allXml, linkToIso));
  console.log(`all.xml: patched yadongxie entry dates`);
}

if (fs.existsSync(ALL_JSON_PATH)) {
  const all = JSON.parse(fs.readFileSync(ALL_JSON_PATH, "utf8"));
  // all.json may be a combined feed object or a map; handle common shapes
  const elements = all.elements ?? all;
  if (Array.isArray(elements)) {
    let n = 0;
    for (const el of elements) {
      if (el.link && linkToIso.has(el.link)) {
        el.retrieved = Date.parse(linkToIso.get(el.link));
        n += 1;
      }
    }
    fs.writeFileSync(ALL_JSON_PATH, JSON.stringify(all));
    console.log(`all.json: updated ${n} retrieved timestamps`);
  }
}
