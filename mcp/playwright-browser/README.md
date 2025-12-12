# Playwright Browser MCP Server

An MCP (Model Context Protocol) server that provides browser automation capabilities using Playwright.

## Features

- **Navigate to URLs** - Open and load web pages
- **Extract page content** - Get text or HTML content from pages
- **Get page titles** - Retrieve page titles
- **Take screenshots** - Capture page screenshots
- **Interact with pages** - Click elements, type text, wait for selectors

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Available Tools

### navigate
Navigate to a URL and wait for the page to load.

**Parameters:**
- `url` (required): The URL to navigate to
- `waitUntil` (optional): When to consider navigation successful ('load', 'domcontentloaded', 'networkidle')

### get_page_content
Get the text content of the current page.

**Parameters:**
- `includeHtml` (optional): Whether to include HTML content (default: false)

### get_page_title
Get the title of the current page.

### screenshot
Take a screenshot of the current page.

**Parameters:**
- `fullPage` (optional): Whether to capture the full page or just the viewport (default: false)

### click
Click an element on the page.

**Parameters:**
- `selector` (required): CSS selector for the element to click

### type
Type text into an input field.

**Parameters:**
- `selector` (required): CSS selector for the input field
- `text` (required): The text to type

### wait_for_selector
Wait for an element to appear on the page.

**Parameters:**
- `selector` (required): CSS selector to wait for
- `timeout` (optional): Timeout in milliseconds (default: 30000)

## Development

To run the server directly (for testing):

```bash
npm start
```

Or:

```bash
node src/server.js
```

The server communicates via stdio, so it's designed to be used by MCP clients rather than run standalone.

## License

MIT
