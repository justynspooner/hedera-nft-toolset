export interface InputTokenInfo {
  tokenName: string;
  tokenSymbol: string;
  decimals?: number;
  maxSupply?: number;
  initialSupply?: number;
  royalties?: {
    recipient: string;
    percentage: number;
    fallbackFeeInHbar?: number;
  }[];
}
