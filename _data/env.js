// _data/env.js
export default function() {
  const mode = process.env.ELEVENTY_RUN_MODE; // build, serve, or watch
  console.log("ELEVENTY_RUN_MODE:", mode);
  return {
    // If mode is 'build', we are in production
    isDev: mode === "serve",
    // Or just pass the mode through
    runMode: mode || "build" 
  };
}