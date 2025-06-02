
export function normalizePath(originalPath: string): string {
  console.log(`[Path Parser] Original path: ${originalPath}`);
  
  let path = originalPath;
  
  // Remover prefixos da função de diferentes formas
  const prefixes = [
    '/functions/v1/hostinger_proxy',
    '/hostinger_proxy',
    '/v1/hostinger_proxy'
  ];
  
  for (const prefix of prefixes) {
    if (path.startsWith(prefix)) {
      path = path.substring(prefix.length);
      console.log(`[Path Parser] Removed prefix ${prefix}, new path: ${path}`);
      break;
    }
  }
  
  // Normalizar path
  if (!path || path === '') {
    path = '/';
  } else if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Remover barras duplas
  path = path.replace(/\/+/g, '/');
  
  console.log(`[Path Parser] Final normalized path: ${path}`);
  return path;
}
