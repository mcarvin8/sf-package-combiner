import { parse, TNode } from 'txml';

export type ParsedManifestType = {
  name: string;
  members: string[];
};

export type ParsedManifest = {
  types: ParsedManifestType[];
  version: string | null;
};

function isElement(node: TNode | string): node is TNode {
  return typeof node !== 'string';
}

function getText(node: TNode): string {
  return node.children
    .filter((child): child is string => typeof child === 'string')
    .join('')
    .trim();
}

function parseTypesElement(typesEl: TNode): ParsedManifestType {
  const children = typesEl.children.filter(isElement);
  const nameEls = children.filter((el) => el.tagName === 'name');
  const memberEls = children.filter((el) => el.tagName === 'members');
  const otherEl = children.find((el) => el.tagName !== 'name' && el.tagName !== 'members');

  if (otherEl) {
    throw new Error(`unexpected element <${otherEl.tagName}> inside <types>`);
  }
  if (nameEls.length !== 1) {
    throw new Error(`<types> must contain exactly one <name> element, found ${nameEls.length}`);
  }

  const name = getText(nameEls[0]);
  if (!name) {
    throw new Error('<types><name> element must not be empty');
  }
  if (memberEls.length === 0) {
    throw new Error(`<types> for "${name}" must contain at least one <members> element`);
  }

  const members = memberEls.map((memberEl) => {
    const member = getText(memberEl);
    if (!member) {
      throw new Error(`<types> for "${name}" contains an empty <members> element`);
    }
    return member;
  });

  return { name, members };
}

/**
 * Parses a package.xml manifest's raw text into its types/members/version.
 * Validates only that the document follows the Metadata API manifest structure
 * (a single <Package> root containing <types>/<version> elements) -- metadata
 * type names are not checked against the Salesforce metadata registry.
 */
export function parseManifestXml(xml: string): ParsedManifest {
  const roots = parse(xml, { decodeEntities: true, skipXmlDeclaration: true }).filter(isElement);

  if (roots.length !== 1 || roots[0].tagName !== 'Package') {
    throw new Error('manifest must have a single <Package> root element');
  }

  const types: ParsedManifestType[] = [];
  let version: string | null = null;
  let versionSeen = false;

  for (const child of roots[0].children.filter(isElement)) {
    if (child.tagName === 'types') {
      types.push(parseTypesElement(child));
    } else if (child.tagName === 'version') {
      if (versionSeen) {
        throw new Error('<Package> must not contain more than one <version> element');
      }
      versionSeen = true;
      version = getText(child);
      if (!version) {
        throw new Error('<Package><version> element must not be empty');
      }
    } else {
      throw new Error(`unexpected element <${child.tagName}> inside <Package>`);
    }
  }

  return { types, version };
}
