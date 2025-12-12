#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium } from 'playwright';

const server = new Server(
  {
    name: 'playwright-browser',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let browser = null;
let context = null;
let page = null;

// Initialize browser on server start
async function initBrowser() {
  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
  } catch (error) {
    console.error('Failed to initialize browser:', error);
  }
}

// Cleanup browser on server shutdown
async function closeBrowser() {
  try {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  } catch (error) {
    console.error('Error closing browser:', error);
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'navigate',
        description: 'Navigate to a URL and wait for the page to load',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to navigate to',
            },
            waitUntil: {
              type: 'string',
              enum: ['load', 'domcontentloaded', 'networkidle'],
              default: 'load',
              description: 'When to consider navigation successful',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'get_page_content',
        description: 'Get the text content of the current page',
        inputSchema: {
          type: 'object',
          properties: {
            includeHtml: {
              type: 'boolean',
              default: false,
              description: 'Whether to include HTML content',
            },
          },
        },
      },
      {
        name: 'get_page_title',
        description: 'Get the title of the current page',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'screenshot',
        description: 'Take a screenshot of the current page',
        inputSchema: {
          type: 'object',
          properties: {
            fullPage: {
              type: 'boolean',
              default: false,
              description: 'Whether to capture the full page or just the viewport',
            },
          },
        },
      },
      {
        name: 'click',
        description: 'Click an element on the page',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the element to click',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'type',
        description: 'Type text into an input field',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the input field',
            },
            text: {
              type: 'string',
              description: 'The text to type',
            },
          },
          required: ['selector', 'text'],
        },
      },
      {
        name: 'wait_for_selector',
        description: 'Wait for an element to appear on the page',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector to wait for',
            },
            timeout: {
              type: 'number',
              default: 30000,
              description: 'Timeout in milliseconds',
            },
          },
          required: ['selector'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Ensure browser is initialized
    if (!page) {
      await initBrowser();
    }

    switch (name) {
      case 'navigate': {
        const { url, waitUntil = 'load' } = args;
        await page.goto(url, { waitUntil });
        return {
          content: [
            {
              type: 'text',
              text: `Successfully navigated to ${url}`,
            },
          ],
        };
      }

      case 'get_page_content': {
        const { includeHtml = false } = args;
        const title = await page.title();
        const url = page.url();
        let content;

        if (includeHtml) {
          content = await page.content();
        } else {
          content = await page.evaluate(() => {
            // Get text content, removing script and style elements
            const clone = document.cloneNode(true);
            const scripts = clone.querySelectorAll('script, style');
            scripts.forEach((el) => el.remove());
            return clone.body?.innerText || clone.documentElement.innerText || '';
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  title,
                  url,
                  content,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_page_title': {
        const title = await page.title();
        return {
          content: [
            {
              type: 'text',
              text: title,
            },
          ],
        };
      }

      case 'screenshot': {
        const { fullPage = false } = args;
        const screenshot = await page.screenshot({ fullPage });
        const base64Data = Buffer.from(screenshot).toString('base64');
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot captured (${fullPage ? 'full page' : 'viewport'})`,
            },
            {
              type: 'image',
              data: base64Data,
              mimeType: 'image/png',
            },
          ],
        };
      }

      case 'click': {
        const { selector } = args;
        await page.click(selector);
        return {
          content: [
            {
              type: 'text',
              text: `Clicked element: ${selector}`,
            },
          ],
        };
      }

      case 'type': {
        const { selector, text } = args;
        await page.fill(selector, text);
        return {
          content: [
            {
              type: 'text',
              text: `Typed text into ${selector}`,
            },
          ],
        };
      }

      case 'wait_for_selector': {
        const { selector, timeout = 30000 } = args;
        await page.waitForSelector(selector, { timeout });
        return {
          content: [
            {
              type: 'text',
              text: `Element appeared: ${selector}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  await initBrowser();
  console.error('Playwright MCP server running on stdio');

  // Cleanup on exit
  process.on('SIGINT', async () => {
    await closeBrowser();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeBrowser();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
