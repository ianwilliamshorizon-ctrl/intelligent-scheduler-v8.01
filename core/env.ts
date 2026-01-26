
// IMPORTANT: This file's purpose is to load environment variables and should be
// imported at the very top of any entry-point file (e.g., index.tsx, seeding.ts).

import * as dotenv from 'dotenv';

// Determine the environment (Vite or Node.js)
const isVite = typeof import.meta !== 'undefined' && import.meta.env;

if (!isVite) {
    // We are in a Node.js environment (like for the seeding script)
    // The seeding script is expected to be run from the project root.
    const result = dotenv.config({ path: '.env.production' });

    if (result.error) {
        // Don't throw an error, but log it. A missing .env file might not be a critical failure.
        console.warn("Warning: Could not load .env.production file for the seeding script. This may be expected if you manage environment variables differently.");
    } else {
        console.log(`.env.production file loaded successfully for the seeding script.`);
        // Manually assign the parsed variables to process.env if they exist
        if (result.parsed) {
            for (const key in result.parsed) {
                process.env[key] = result.parsed[key];
            }
        }
    }
}

// This file doesn't need to export anything; its side effect of loading
// dotenv is what we need.
