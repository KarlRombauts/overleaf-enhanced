export function removeNulls<T>(array: (T | null | undefined)[]): T[] {
  return array.filter<T>((element): element is T => {
    return element !== null && element !== undefined;
  });
}
