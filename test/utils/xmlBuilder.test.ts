import { describe, expect, it } from 'vitest';

import { buildXml } from '../../src/utils/xmlBuilder.js';

describe('buildXml', () => {
  it('renders attributes, repeated array elements, and text nodes', () => {
    const xml = buildXml({
      Package: {
        '@_xmlns': 'http://soap.sforce.com/2006/04/metadata',
        types: [
          { name: 'ApexClass', members: ['Foo', 'Bar & Baz', 'A<B'] },
          { name: 'CustomObject', members: ['Account'] },
        ],
        version: '59.0',
      },
    });

    expect(xml).toBe(
      [
        '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
        '    <types>',
        '        <name>ApexClass</name>',
        '        <members>Foo</members>',
        '        <members>Bar &amp; Baz</members>',
        '        <members>A&lt;B</members>',
        '    </types>',
        '    <types>',
        '        <name>CustomObject</name>',
        '        <members>Account</members>',
        '    </types>',
        '    <version>59.0</version>',
        '</Package>\n',
      ].join('\n'),
    );
  });

  it('renders empty root as a paired self-closing-free tag when there are no children', () => {
    const xml = buildXml({ Package: { '@_xmlns': 'ns', types: [] } });
    expect(xml).toBe('<Package xmlns="ns"></Package>\n');
  });

  it('omits undefined fields entirely', () => {
    const xml = buildXml({ Package: { '@_xmlns': 'ns', types: [], version: undefined } });
    expect(xml).not.toContain('<version>');
  });
});
