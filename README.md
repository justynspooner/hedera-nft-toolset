Please use this code at your own risk. By using this code you agree to take full responsibility for any damage or loss of data that may occur. This code is provided as-is with no warranty or guarantee of any kind. You are responsible for testing this code in a non-production environment before using it in production.

# Hedera NFT Toolset

Initially forked from [HSuite](https://github.com/HbarSuite/nft-minter), this is a collection of tools for working with NFTs on the Hedera Hashgraph.

## Installation

First install Node from [here](https://nodejs.org/en/download/).

Then you can install the dependencies and devDependencies by running:

```bash
$ npm install
```

or if you use yarn:

```bash
$ yarn
```

## Setup

To run any of the scripts you will need to create an environment file in the root of the project.

This file is used to store all the environment variables that are used by the scripts.

You will create 2 new files, one for development and one for production. Name them:

- `.env.development`
  This is where you will store all your testnet account details.

- `.env.production`
  This is where you will store all your mainnet account details.

Copy the contents of the `env_example` to your new files and update all the values as detailed below.

This command will create the new files for you:

```bash
$ cp env_example .env.development && cp env_example .env.production
```

```bash
HEDERA_NETWORK                  = <testnet OR mainnet>
NFT_STORAGE_KEY                 = <your nft.storage key>
OPERATOR_ACCOUNT_ID             = <your operator account id>
OPERATOR_PRIVATE_KEY            = <your operator private key>
TREASURY_ACCOUNT_ID             = <your treasury account id>
TREASURY_PRIVATE_KEY            = <your treasury private key>
AUTO_RENEW_ACCOUNT_ID           = <your auto renew account id>
AUTO_RENEW_PRIVATE_KEY          = <your auto renew private key>
NFT_TOKEN_ID                    = <your nft token id>
NFT_SUPPLY_PRIVATE_KEY          = <your nft supply private key>
MERGE_ATTRIBUTES_TO_PROPERTIES  = <true or false>
```

### NFT_STORAGE_KEY

This is used to upload the NFT metadata and images to IPFS (Interplanetary File System).
Sign up for a free NFT Storage account here: https://nft.storage/login/ to get your API key.

### OPERATOR_ACCOUNT_ID

The Hedera account ID that will pay for all the transactions, this is different to the treasury account id that will hold the NFTs.

### OPERATOR_PRIVATE_KEY

The private key for the operator account.

### TREASURY_ACCOUNT_ID

The Hedera account ID that will hold the NFTs.

### TREASURY_PRIVATE_KEY

The private key for the treasury account.

### AUTO_RENEW_ACCOUNT_ID

The Hedera account ID that will be used to auto renew the NFT token. If no account is provided, the treasury account will be used.

### AUTO_RENEW_PRIVATE_KEY

The private key for the auto renew account.

### NFT_TOKEN_ID

The token ID that the mint command will mint NFTs to.

### NFT_SUPPLY_PRIVATE_KEY

The private key for the NFT supply account.

### MERGE_ATTRIBUTES_TO_PROPERTIES

If you set `MERGE_ATTRIBUTES_TO_PROPERTIES` to `true` then any attributes that you add to your NFT will be duplicated to the properties field as key value pairs, example:

```json
{
  "name": "My NFT",
  "description": "My NFT description",
  "image": "ipfs://<CID>/image.jpeg",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Eyes",
      "value": "Green"
    },
    {
      "trait_type": "Mouth",
      "value": "Smile"
    }
  ],
  "properties": {
    "Background": "Blue",
    "Eyes": "Green",
    "Mouth": "Smile"
  }
}
```

## Creating a New Token

Add a file called `./input/tokenInfo.json` with the following format and update the values to suit your needs.

```json
{
  "tokenName": "Token Name",
  "tokenSymbol": "SYMBOL",
  "royalties": [
    {
      "recipient": "0.0.123456",
      "percentage": 10,
      "fallbackFeeInHbar": 50
    },
    {
      "recipient": "0.0.234567",
      "percentage": 2
    }
  ]
}
```

Run the following command to create the token:

```bash
$ npm run token:create
or
$ yarn token:create
```

This will output a new file at `./output/token-secrets-0.0.000000.json`. This file contains the token ID and the private key for the token supply account. You will need to add these to your `.env.development` file in order to mint NFTs.

# IMPORTANT: BACKUP YOUR SUPPLY PRIVATE KEY! YOU WILL NEED THIS TO MINT NFTS.

## Minting NFTs

Make sure to set the `NFT_TOKEN_ID` and `NFT_SUPPLY_PRIVATE_KEY` in your `.env.development` file.

Modify the `mintQueue.json` file, by filling the array with the NFTs you would like to mint.

The format should be like this example:

```json
[
  {
    "name": "Name of the first NFT",
    "description": "A description of the first NFT",
    "creator": "Name of the creator",
    "image": "preview/previewImage1.jpeg",
    "type": "image/jpeg",
    "files": [
      {
        "uri": "highres/highResolutionImage1.jpeg",
        "type": "image/jpeg",
        "metadata": {
          "name": "High Resolution Image 1",
          "description": "A high resolution image"
        }
      }
    ],
    "properties": {
      "collection": "Name of the collection"
    },
    "attributes": [
      { "trait_type": "species", "value": "Human" },
      { "trait_type": "clan", "value": "Vikings" },
      { "trait_type": "attack", "value": 89 },
      { "trait_type": "defence", "value": 70 },
      { "trait_type": "speed", "value": 76 },
      { "trait_type": "agility", "value": 68 },
      { "trait_type": "intelligence", "value": 32 },
      { "trait_type": "magic", "value": 43 },
      { "trait_type": "total", "value": 378 }
    ]
  },
  {
    "name": "Name of the second NFT",
    "description": "A description of the second NFT",
    "creator": "Name of the creator",
    "image": "preview/previewImage2.jpeg",
    "type": "image/jpeg",
    "files": [
      {
        "uri": "highres/highResolutionImage2.jpeg",
        "type": "image/jpeg"
      }
    ]
  }
]
```

The mint script will automatically upload all your media assets to IPFS. All you need to do is copy your files to the `./input/media` folder and then reference them in the `mintQueue.json` file as shown above. It's important to note that the `image` and `uri` fields should be relative paths to the `./input/media` folder and should match the file names exactly.

To mint your collection, be sure your operator has got enough HBAR to mint them all, then simply run:

```bash
$ npm run token:mint
or
$ yarn token:mint
```

Once minted, you can check your collection out using any good NFT explorer. A few examples being:

- [Zion NFT Explorer](zionft.com)
- [HashScan](https://hashscan.io/)
- [Dragon Glass](https://dragonglass.me/)

## Burning NFTs

Occasionally you may want to burn an NFT, for example if you have made a mistake during a mint and want to remove it from your collection.

You can only burn NFTs that currently sit in the treasury account, so you will need to be the owner of the NFT.

To burn specific NFTs from your token collection, simply create a new file at `./input/serialsToBurn.json` and add the serial numbers of the NFTs you want to burn including the token ID and supply private key.

```json
{
  "tokenId": "0.0.1234567",
  "serials": [4, 7, 8],
  "privateSupplyKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

Then run the following command:

```bash
$ npm run token:burn
or
$ yarn token:burn
```

## Cloning Tokens

Hedera have begun resetting the testnet every quarter, which means that all the tokens and NFTs that you have created will be deleted. It can be a pain if you have to recreate all your tokens and NFTs every time.

The `token:clone` script will allow you to clone an existing token from mainnet and all of its NFTs to a new token on testnet.

You'll need to fill the following fields in your `.env.development` file:

```bash
  OPERATOR_ACCOUNT_ID=0.0.xxxxxx
  OPERATOR_PRIVATE_KEY=0.0.xxxxxx
  TREASURY_ACCOUNT_ID=0.0.xxxxxx
  TREASURY_PRIVATE_KEY=0.0.xxxxxx
  AUTO_RENEW_ACCOUNT_ID=0.0.xxxxxx
```

The new tokens will be cloned to the `TREASURY_ACCOUNT_ID`

Just run the following command, replacing the token ID with the ID of the token you want to clone:

```bash
$ npm run token:clone 0.0.1234567
or
$ yarn token:clone 0.0.1234567
```
