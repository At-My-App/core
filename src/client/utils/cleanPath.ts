// remove leading and trailing slashes and replace multiple slashes with a single slash
export const cleanPath = (path: string) => {
  return path.replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
};
