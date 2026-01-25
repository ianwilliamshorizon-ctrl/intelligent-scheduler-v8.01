
// IMPORTANT: This file's purpose is to load environment variables and should be
// imported at the very top of any entry-point file (e.g., index.tsx, seeding.ts).

import * as dotenv from 'dotenv';
import * as path from 'path';

// Determine the environment (Vite or Node.js)
const isVite = typeof import.meta !== 'undefined' && import.meta.env;

if (!isVite) {
    // We are in a Node.js environment (like for the seeding script)
    // Explicitly point to the .env.production file in the project root.
    const envPath = path.resolve(process.cwd(), '.env.production');
    const result = dotenv.config({ path: envPath });

    if (result.error) {
        console.error("Error loading .env.production file for seeding script:", result.error);
    } else {
        console.log(`.env.production file loaded successfully from ${envPath}`);
        // Manually assign the parsed variables to process.env
        if (result.parsed) {
            for (const key in result.parsed) {
                process.env[key] = result.parsed[key];
            }
        }
    }
}

// This file doesn't need to export anything; its side effect of loading
// dotenv is what we need.
