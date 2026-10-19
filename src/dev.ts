// `process.env.NODE_ENV` is left in the build for the bundler of the app to replace
// (vite.dev/guide/build#library-mode). A page that loads the UMD build without a bundler has no
// `process`: it counts as production.
const isDev = (() => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
})();

/** Warns about a misuse of the components, in development only. */
export function warn(message: string) {
  if (isDev) console.warn(`[sb-floating-panel-vue] ${message}`);
}
