import { ParserBase } from "@orillusion/core";
import { Font } from "../lib/opentype";
export declare class FontParser extends ParserBase {
    data: Font;
    parseBuffer(buffer: ArrayBuffer): Promise<void>;
    verification(): boolean;
}
