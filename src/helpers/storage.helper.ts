import * as fs from "fs";

export class StorageHelper {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  writeFile(content: any, isJSON: boolean = false) {
    try {
      if (isJSON) {
        return fs.writeFileSync(this.filePath, JSON.stringify(content), {
          flag: "w+",
        });
      } else {
        return fs.writeFileSync(this.filePath, content, { flag: "w+" });
      }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  readFile(isJSON: boolean = false) {
    try {
      const content = fs.readFileSync(this.filePath, { flag: "a+" });
      let buffer = null;

      if (isJSON) {
        buffer = Buffer.from(content.toJSON().data);
        return JSON.parse(buffer.toString());
      } else {
        buffer = Buffer.from(content);
        return buffer;
      }
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
