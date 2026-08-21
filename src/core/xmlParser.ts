export type XmlNode = {
  tagName: string;
  children: Array<XmlNode | string>;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const codePoint = entity[1] === 'x' ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
      return String.fromCodePoint(codePoint);
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}

/**
 * Minimal recursive-descent XML parser scoped to Salesforce package.xml manifests:
 * elements, attributes (skipped -- unused by callers), text, entities, comments,
 * and the leading <?xml ?> declaration. No DTD/CDATA support since manifests don't use them.
 */
export function parseXml(xml: string): XmlNode[] {
  const length = xml.length;
  let i = 0;

  function skipWhitespace(): void {
    while (i < length && /\s/.test(xml[i])) i++;
  }

  function parseName(): string {
    const start = i;
    while (i < length && !/[\s/>]/.test(xml[i])) i++;
    if (i === start) {
      throw new Error(`expected element name at position ${i}`);
    }
    return xml.slice(start, i);
  }

  function skipAttributes(): void {
    while (true) {
      skipWhitespace();
      if (i >= length) {
        throw new Error('unexpected end of input inside a tag');
      }
      const ch = xml[i];
      if (ch === '>' || ch === '/') return;

      while (i < length && !/[\s=/>]/.test(xml[i])) i++;
      skipWhitespace();
      if (xml[i] !== '=') {
        throw new Error(`expected "=" in attribute at position ${i}`);
      }
      i++;
      skipWhitespace();
      const quote = xml[i];
      if (quote !== '"' && quote !== "'") {
        throw new Error(`expected quoted attribute value at position ${i}`);
      }
      i++;
      const end = xml.indexOf(quote, i);
      if (end === -1) {
        throw new Error('unterminated attribute value');
      }
      i = end + 1;
    }
  }

  function skipComment(): void {
    const end = xml.indexOf('-->', i + 4);
    if (end === -1) {
      throw new Error('unterminated comment');
    }
    i = end + 3;
  }

  function skipDeclaration(): void {
    const end = xml.indexOf('?>', i + 2);
    if (end === -1) {
      throw new Error('unterminated processing instruction');
    }
    i = end + 2;
  }

  function parseElement(): XmlNode {
    i++; // consume '<'
    const tagName = parseName();
    skipAttributes();

    if (xml[i] === '/') {
      i += 2; // consume '/>'
      return { tagName, children: [] };
    }
    i++; // consume '>'

    const children: Array<XmlNode | string> = [];
    while (true) {
      if (i >= length) {
        throw new Error(`unterminated element <${tagName}>`);
      }
      if (xml.startsWith('<!--', i)) {
        skipComment();
        continue;
      }
      if (xml.startsWith('</', i)) {
        const closeEnd = xml.indexOf('>', i + 2);
        if (closeEnd === -1) {
          throw new Error(`unterminated closing tag for <${tagName}>`);
        }
        const closeName = xml.slice(i + 2, closeEnd).trim();
        if (closeName !== tagName) {
          throw new Error(`mismatched closing tag </${closeName}> for <${tagName}>`);
        }
        i = closeEnd + 1;
        return { tagName, children };
      }
      if (xml[i] === '<') {
        children.push(parseElement());
        continue;
      }

      const nextTag = xml.indexOf('<', i);
      const textEnd = nextTag === -1 ? length : nextTag;
      children.push(decodeEntities(xml.slice(i, textEnd)));
      i = textEnd;
    }
  }

  const roots: XmlNode[] = [];
  while (i < length) {
    skipWhitespace();
    if (i >= length) break;
    if (xml.startsWith('<!--', i)) {
      skipComment();
      continue;
    }
    if (xml.startsWith('<?', i)) {
      skipDeclaration();
      continue;
    }
    if (xml[i] !== '<') {
      throw new Error(`unexpected content outside the root element at position ${i}`);
    }
    roots.push(parseElement());
  }
  return roots;
}
