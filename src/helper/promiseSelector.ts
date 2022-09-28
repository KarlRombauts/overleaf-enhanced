export function promiseSelector(query: string, pollingRate = 300) {
  return new Promise<HTMLElement>((resolve) => {
    const interval = setInterval(() => {
      const element = document.querySelector<HTMLElement>(query);
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
    }, pollingRate);
  });
}
