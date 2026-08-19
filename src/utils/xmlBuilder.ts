const ATTRIBUTE_PREFIX = '@_';
const INDENT = '    ';

// Matches fast-xml-builder's default entity order: & must run first so
// entities it introduces (&lt; etc.) are not themselves re-escaped.
const escapeXmlValue = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('>', '&gt;')
    .replaceAll('<', '&lt;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;');

const toText = (value: unknown): string => String(value);

type XmlNode = Record<string, unknown>;

function buildAttributes(node: XmlNode): string {
  let attrStr = '';
  for (const key of Object.keys(node)) {
    if (!key.startsWith(ATTRIBUTE_PREFIX)) continue;
    const name = key.slice(ATTRIBUTE_PREFIX.length);
    attrStr += ` ${name}="${escapeXmlValue(toText(node[key]))}"`;
  }
  return attrStr;
}

function buildChildren(node: XmlNode, depth: number): string {
  let out = '';
  for (const key of Object.keys(node)) {
    if (key.startsWith(ATTRIBUTE_PREFIX)) continue;
    const value = node[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) out += buildElement(key, item, depth);
    } else {
      out += buildElement(key, value, depth);
    }
  }
  return out;
}

function buildElement(key: string, value: unknown, depth: number): string {
  const indent = INDENT.repeat(depth);
  if (value === null) return `${indent}<${key}/>\n`;

  if (typeof value !== 'object') {
    return `${indent}<${key}>${escapeXmlValue(toText(value))}</${key}>\n`;
  }

  const node = value as XmlNode;
  const attrStr = buildAttributes(node);
  const childrenStr = buildChildren(node, depth + 1);
  return childrenStr === ''
    ? `${indent}<${key}${attrStr}></${key}>\n`
    : `${indent}<${key}${attrStr}>\n${childrenStr}${indent}</${key}>\n`;
}

/**
 * Minimal replacement for fast-xml-builder, matching its output byte-for-byte
 * for this project's config (format: true, indentBy: 4 spaces, ignoreAttributes:
 * false, attributeNamePrefix: '@_', suppressEmptyNode: false). Root object must
 * have exactly one top-level key.
 */
export function buildXml(jObj: XmlNode): string {
  const [rootKey] = Object.keys(jObj);
  return buildElement(rootKey, jObj[rootKey], 0);
}
