# Adding a New MCP Server

This template helps you create a new MCP server in this collection.

## Steps

1. **Create the server directory:**
   ```bash
   mkdir mcp/your-server-name
   mkdir mcp/your-server-name/src
   ```

2. **Create `package.json`:**
   ```json
   {
     "name": "@mcp-practice/your-server-name",
     "version": "1.0.0",
     "description": "Description of your MCP server",
     "type": "module",
     "main": "src/server.js",
     "scripts": {
       "start": "node src/server.js"
     },
     "keywords": ["mcp", "your-keywords"],
     "author": "",
     "license": "MIT",
     "dependencies": {
       "@modelcontextprotocol/sdk": "^0.5.0",
       // Add your server-specific dependencies here
     }
   }
   ```

3. **Create `src/server.js`:**
   ```javascript
   #!/usr/bin/env node

   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
   import {
     CallToolRequestSchema,
     ListToolsRequestSchema,
   } from '@modelcontextprotocol/sdk/types.js';

   const server = new Server(
     {
       name: 'your-server-name',
       version: '1.0.0',
     },
     {
       capabilities: {
         tools: {},
       },
     }
   );

   // List available tools
   server.setRequestHandler(ListToolsRequestSchema, async () => {
     return {
       tools: [
         // Define your tools here
       ],
     };
   });

   // Handle tool calls
   server.setRequestHandler(CallToolRequestSchema, async (request) => {
     const { name, arguments: args } = request.params;
     // Implement your tool handlers here
   });

   // Start server
   async function main() {
     const transport = new StdioServerTransport();
     await server.connect(transport);
     console.error('Your MCP server running on stdio');
   }

   main().catch((error) => {
     console.error('Fatal error:', error);
     process.exit(1);
   });
   ```

4. **Create `README.md`** with documentation for your server

5. **Update `setup-cursor-config.ps1`** to include your server in the configuration

6. **Install dependencies:**
   ```bash
   cd mcp/your-server-name
   npm install
   ```

7. **Update root `README.md`** to document your new server

## Example Server Structure

```
mcp/your-server-name/
├── src/
│   └── server.js          # Main server implementation
├── package.json            # Server dependencies
├── README.md               # Server documentation
└── .gitignore             # Server-specific ignores
```

