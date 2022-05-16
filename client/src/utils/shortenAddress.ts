export const shortenAddress: (address: string) => string = (address) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;
