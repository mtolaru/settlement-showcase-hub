
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Set environment-specific configuration
  const isProduction = mode === 'production';
  const isStaging = mode === 'staging';
  
  console.log(`Building for ${mode} environment`);

  return {
    define: {
      // Make environment variables available to the app
      'process.env.VITE_APP_ENV': JSON.stringify(mode),
      'process.env.VITE_IS_PRODUCTION': JSON.stringify(isProduction),
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      (mode === 'development' || mode === 'staging') &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Set environment-specific build options
    build: {
      sourcemap: !isProduction,
      minify: isProduction,
    }
  };
});
