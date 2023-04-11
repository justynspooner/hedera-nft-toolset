import { AccountId } from "@hashgraph/sdk";
import { InputTokenInfo } from "../../types";

export default function validate(tokenInfo: InputTokenInfo): boolean {
  if (!tokenInfo) {
    throw new Error("'tokenInfo.json' must be present");
  }

  // Check that token info is valid
  const { tokenName, tokenSymbol, royalties } = tokenInfo || {};
  if (tokenName == null || tokenSymbol == null) {
    throw new Error(
      "'tokenInfo.json' must contain 'tokenName' and 'tokenSymbol'"
    );
  }

  // Check that each has a length less than 100 characters
  if (tokenName.length > 100) {
    throw new Error("'tokenName' must be less than 100 characters");
  }
  if (tokenSymbol.length > 100) {
    throw new Error("'tokenSymbol' must be less than 100 characters");
  }

  if (royalties?.length) {
    // Check all royalties don't exceed 100%
    const totalPercentage = royalties.reduce(
      (total, royalty) => total + royalty.percentage,
      0
    );

    if (totalPercentage > 100) {
      throw new Error("Total royalty percentage cannot exceed 100%");
    }

    // Check there are no more than 10 royalties
    if (royalties.length > 10) {
      throw new Error("Cannot have more than 10 royalties");
    }

    // Check that all royalties have a valid recipient
    for (const royalty of royalties) {
      if (royalty.recipient == null) {
        throw new Error("Royalty recipient must be present");
      }
      try {
        const accountId = AccountId.fromString(royalty.recipient);
      } catch (error) {
        throw new Error(
          `Royalty recipient ${royalty.recipient} must be a valid Hedera account ID`
        );
      }

      // Check that all royalties have a valid percentage
      if (royalty.percentage == null) {
        throw new Error("Royalty percentage must be present");
      }
      if (royalty.percentage < 0 || royalty.percentage > 100) {
        throw new Error(
          `Royalty percentage ${royalty.percentage} must be between 0 and 100`
        );
      }

      // Check the royalty percentage is a whole number
      if (royalty.percentage % 1 !== 0) {
        throw new Error(
          `Royalty percentage ${royalty.percentage} must be a whole number`
        );
      }

      // Check that all royalties have a valid fallback fee

      const { fallbackFeeInHbar } = royalty;

      if (fallbackFeeInHbar) {
        if (fallbackFeeInHbar < 0) {
          throw new Error(
            `Royalty fallback fee ${fallbackFeeInHbar} must be greater than 0`
          );
        }
        // Check the fallback fee is a whole number
        if (fallbackFeeInHbar % 1 !== 0) {
          throw new Error(
            `Royalty fallback fee ${fallbackFeeInHbar} must be a whole number`
          );
        }
      }
    }
  }

  return true;
}
