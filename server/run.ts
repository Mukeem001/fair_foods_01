// Startup wrapper to allow silencing console output before loading the app.
// Set QUIET_CONSOLE=true to suppress non-error logs (console.log / console.info).
if (String(process.env.QUIET_CONSOLE || '').toLowerCase() === 'true') {
  // Preserve errors and warnings
  console.log = () => {};
  console.info = () => {};
}

// Now import the main server
import './index';
