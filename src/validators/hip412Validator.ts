import Ajv from "ajv";
import addFormats from "ajv-formats";
import hip412Schema from "./hip412Schema";

const ajv = new Ajv({ allowUnionTypes: true });
addFormats(ajv);

const validate = ajv.compile(hip412Schema);

export default validate;
