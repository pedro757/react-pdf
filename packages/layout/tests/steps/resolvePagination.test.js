import { describe, expect, test } from 'vitest';

import { loadYoga } from '../../src/yoga';

import resolvePagination from '../../src/steps/resolvePagination';
import resolveDimensions from '../../src/steps/resolveDimensions';

// dimensions is required by pagination step and them are calculated here
const calcLayout = (node) => resolvePagination(resolveDimensions(node));

describe('pagination step', () => {
  test('should stretch absolute block to full page size', async () => {
    const yoga = await loadYoga();

    const root = {
      type: 'DOCUMENT',
      yoga,
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 100,
            height: 100,
          },
          children: [
            {
              type: 'VIEW',
              box: {},
              style: {
                position: 'absolute',
                width: '50%',
                top: 0,
                bottom: 0,
              },
              props: {},
              children: [],
            },
            {
              type: 'TEXT',
              box: {},
              style: {},
              props: {},
              children: [
                {
                  type: 'TEXT_INSTANCE',
                  value: 'hello world',
                },
              ],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);

    const page = layout.children[0];
    const view = layout.children[0].children[0];

    expect(page.box.height).toBe(100);
    expect(view.box.height).toBe(100);
  });

  test('should force new height for split nodes', async () => {
    const yoga = await loadYoga();

    const root = {
      type: 'DOCUMENT',
      yoga,
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 15,
            height: 60,
          },

          children: [
            {
              type: 'VIEW',
              box: {},
              style: {},
              props: {},
              children: [
                {
                  type: 'TEXT',
                  box: {},
                  style: {},
                  props: {},
                  children: [
                    {
                      type: 'TEXT_INSTANCE',
                      value: 'a a a a',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);

    const view1 = layout.children[0].children[0];
    const view2 = layout.children[1].children[0];

    expect(view1.box.height).toBe(60);
    expect(view2.box.height).not.toBe(60);
  });

  test('should force new height for split nodes with fixed height', async () => {
    const yoga = await loadYoga();

    const root = {
      type: 'DOCUMENT',
      yoga,
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 5,
            height: 60,
          },

          children: [
            {
              type: 'VIEW',
              box: {},
              style: { height: 130 },
              props: {},
              children: [],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);

    const view1 = layout.children[0].children[0];
    const view2 = layout.children[1].children[0];
    const view3 = layout.children[2].children[0];

    expect(view1.box.height).toBe(60);
    expect(view2.box.height).toBe(60);
    expect(view3.box.height).toBe(10);
  });

  test('should not wrap page with false wrap prop', async () => {
    const yoga = await loadYoga();

    const root = {
      type: 'DOCUMENT',
      yoga,
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 5,
            height: 60,
          },
          props: {
            wrap: false,
          },
          children: [
            {
              type: 'VIEW',
              box: {},
              style: { height: 130 },
              props: {},
              children: [],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);

    expect(layout.children.length).toBe(1);
  });

  test('should break on a container whose children can not fit on a page', async () => {
    const yoga = await loadYoga();

    const root = {
      type: 'DOCUMENT',
      yoga,
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 5,
            height: 60,
          },

          children: [
            {
              type: 'VIEW',
              box: {},
              style: {
                width: 5,
                height: 40,
              },
              props: {},
              children: [],
            },
            {
              type: 'VIEW',
              box: {},
              style: {
                width: 5,
              },
              props: {},
              children: [
                {
                  type: 'VIEW',
                  box: {},
                  style: {
                    height: 40,
                  },
                  props: {
                    wrap: false,
                  },
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);

    const page1 = layout.children[0];
    const page2 = layout.children[1];

    // Only the first view is displayed on the first page
    expect(page1.children.length).toBe(1);
    // The second page displays the second wrapper, with its full height
    expect(page2.children.length).toBe(1);
    expect(page2.children[0].box.height).toBe(40);
  });

  test('should not infinitely loop when splitting pages', async () => {
    const yoga = await loadYoga();

    const root = {
      type: 'DOCUMENT',
      yoga,
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            height: 400,
          },
          children: [
            {
              type: 'VIEW',
              box: {},
              style: { height: 401 },
              children: [
                {
                  type: 'VIEW',
                  box: {},
                  style: {
                    height: 400,
                  },
                  props: { wrap: false, break: true },
                },
              ],
            },
          ],
        },
      ],
    };

    calcLayout(root);

    // If calcLayout returns then we did not hit an infinite loop
    expect(true).toBe(true);
  });
});