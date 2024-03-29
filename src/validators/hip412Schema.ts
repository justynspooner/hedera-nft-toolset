const hip412Schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      description: "Identifies the asset to which this token represents.",
    },
    creator: {
      type: "string",
      description: "Identifies the artist name(s).",
    },
    creatorDID: {
      type: "string",
      format: "uri",
      description:
        "Points to a decentralized identifier to identify the creator.",
    },
    description: {
      type: "string",
      description: "Describes the asset to which this token represents.",
    },
    image: {
      type: "string",
      format: "uri",
      description:
        "A URI pointing to a resource with mime type image/* representing the asset to which this token represents. Consider making any images at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive.",
    },
    checksum: {
      type: "string",
      description:
        "Cryptographic SHA-256 hash of the representation of the 'image' resource.",
    },
    type: {
      type: "string",
      description: "Sets the MIME type for the 'image' resource.",
    },
    format: {
      type: "string",
      default: "HIP412@2.0.0",
      description:
        "Name of the format or schema used by the NFT. For this schema representing Hedera Collectible NFts, set 'format' to 'HIP412@2.0.0'.",
    },
    properties: {
      type: "object",
      description:
        "Holds any arbitrary properties. Values may be strings, numbers, booleans, objects or arrays.",
    },
    files: {
      type: "array",
      items: {
        type: "object",
        properties: {
          uri: {
            type: "string",
            format: "uri",
            description: "A URI pointing to a resource.",
          },
          checksum: {
            type: "string",
            description:
              "Cryptographic SHA-256 hash of the representation of the 'uri' resource.",
          },
          type: {
            type: "string",
            description: "Sets the MIME type for the 'image' resource.",
          },
          is_default_file: {
            type: "boolean",
            description:
              "Indicates if this file object is the main file representing the NFT.",
          },
          metadata: {
            type: "object",
            description:
              "Represents a nested metadata object for the file, which follows the same metadata format as the root metadata. Files can be nested indefinitely in this way, but processed with the same metadata code.",
          },
          metadata_uri: {
            type: "string",
            format: "uri",
            description:
              "A URI pointing to a metadata resource, which follows the same metadata format as the root metadata. Files can be nested indefinitely in this way, but processed with the same metadata code.",
          },
        },
        required: ["uri", "type"],
        additionalProperties: false,
      },
    },
    attributes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          trait_type: {
            type: "string",
            description: "Name of trait.",
          },
          display_type: {
            type: "string",
            description: "Sets the representation of the value of the trait.",
          },
          value: {
            type: ["string", "integer", "number", "boolean"],
            description: "Value for trait.",
          },
          max_value: {
            type: ["string", "integer", "number"],
            description: "Maximum value for trait.",
          },
        },
        required: ["trait_type", "value"],
        additionalProperties: false,
      },
    },
    localization: {
      type: "object",
      required: ["uri", "default", "locales"],
      properties: {
        uri: {
          type: "string",
          description:
            "The URI pattern to fetch localized data from. This URI should contain the substring `{locale}` which will be replaced with the appropriate two-letter langauge code value before sending the request. Format: <protocol>://<hash>/{locale}.json",
        },
        default: {
          type: "string",
          description:
            "Sets the two-letter language code that represents the default locale for this metadata file.",
        },
        locales: {
          type: "array",
          description: "The list of locales for which data is available.",
          items: {
            type: "string",
          },
        },
      },
      additionalProperties: false,
    },
  },
  required: ["name", "image", "type"],
};

export default hip412Schema;
