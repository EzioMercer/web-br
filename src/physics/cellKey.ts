export const cellKey = (i: number, j: number) => {
  return (i + 2048) * 4096 + (j + 2048);
};
