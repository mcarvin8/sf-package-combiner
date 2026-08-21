import { describe, expect, it } from 'vitest';

import { parseXml } from '../../src/core/xmlParser.js';

describe('parseXml', () => {
  it('parses a simple element with text content', () => {
    const roots = parseXml('<Package><version>60.0</version></Package>');
    expect(roots).toEqual([
      {
        tagName: 'Package',
        children: [{ tagName: 'version', children: ['60.0'] }],
      },
    ]);
  });

  it('skips the leading xml declaration', () => {
    const roots = parseXml('<?xml version="1.0" encoding="UTF-8"?>\n<Package></Package>');
    expect(roots).toEqual([{ tagName: 'Package', children: [] }]);
  });

  it('skips attributes, including namespaces', () => {
    const roots = parseXml('<Package xmlns="http://soap.sforce.com/2006/04/metadata"></Package>');
    expect(roots).toEqual([{ tagName: 'Package', children: [] }]);
  });

  it('skips a comment before the root element', () => {
    const roots = parseXml('<!-- leading comment --><Package></Package>');
    expect(roots).toEqual([{ tagName: 'Package', children: [] }]);
  });

  it('skips comments', () => {
    const roots = parseXml('<Package><!-- a comment --><version>60.0</version></Package>');
    expect(roots).toEqual([
      {
        tagName: 'Package',
        children: [{ tagName: 'version', children: ['60.0'] }],
      },
    ]);
  });

  it('decodes named and numeric entities in text', () => {
    const roots = parseXml('<members>A &amp; B &#65; &#x42;</members>');
    expect(roots).toEqual([{ tagName: 'members', children: ['A & B A B'] }]);
  });

  it('leaves unknown entities untouched', () => {
    const roots = parseXml('<members>A &foo; B</members>');
    expect(roots).toEqual([{ tagName: 'members', children: ['A &foo; B'] }]);
  });

  it('parses self-closing elements', () => {
    const roots = parseXml('<Package><version/></Package>');
    expect(roots).toEqual([
      {
        tagName: 'Package',
        children: [{ tagName: 'version', children: [] }],
      },
    ]);
  });

  it('parses multiple sibling root elements', () => {
    const roots = parseXml('<Package></Package><Package></Package>');
    expect(roots).toHaveLength(2);
  });

  it('parses nested elements with multiple children', () => {
    const roots = parseXml(`<Package>
  <types>
    <members>A</members>
    <members>B</members>
    <name>ApexClass</name>
  </types>
</Package>`);
    const [pkg] = roots;
    const types = pkg.children.find((c) => typeof c !== 'string');
    expect(types).toBeDefined();
    expect((types as { tagName: string }).tagName).toBe('types');
  });

  it('throws on a mismatched closing tag', () => {
    expect(() => parseXml('<Package><types></wrong></Package>')).toThrow(/mismatched closing tag/);
  });

  it('throws on an unterminated element', () => {
    expect(() => parseXml('<Package><types>')).toThrow(/unterminated element/);
  });

  it('throws on an unterminated element with trailing text and no closing tag', () => {
    expect(() => parseXml('<Package>trailing text')).toThrow(/unterminated element/);
  });

  it('throws on content outside the root element', () => {
    expect(() => parseXml('text<Package></Package>')).toThrow(/unexpected content outside the root element/);
  });

  it('throws on an unterminated comment', () => {
    expect(() => parseXml('<Package><!-- oops</Package>')).toThrow(/unterminated comment/);
  });

  it('throws on an unterminated processing instruction', () => {
    expect(() => parseXml('<?xml version="1.0"')).toThrow(/unterminated processing instruction/);
  });

  it('throws on an unterminated closing tag', () => {
    expect(() => parseXml('<Package></Package')).toThrow(/unterminated closing tag/);
  });

  it('throws on a missing attribute value', () => {
    expect(() => parseXml('<Package xmlns=></Package>')).toThrow(/expected quoted attribute value/);
  });

  it('throws on an unterminated attribute value', () => {
    expect(() => parseXml('<Package xmlns="unterminated></Package>')).toThrow(/unterminated attribute value/);
  });

  it('throws on a missing equals sign in an attribute', () => {
    expect(() => parseXml('<Package xmlns "x"></Package>')).toThrow(/expected "=" in attribute/);
  });

  it('throws on unexpected end of input inside a tag', () => {
    expect(() => parseXml('<Package xmlns="x"')).toThrow(/unexpected end of input inside a tag/);
  });

  it('throws on a missing element name', () => {
    expect(() => parseXml('<>')).toThrow(/expected element name/);
  });
});
