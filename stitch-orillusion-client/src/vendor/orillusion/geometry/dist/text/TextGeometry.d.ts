import { ExtrudeGeometry, ExtrudeGeometryArgs } from "../ExtrudeGeometry/ExtrudeGeometry";
import { Font } from "../lib/opentype";
export type TextGeometryArgs = ExtrudeGeometryArgs & {
    font: Font;
    fontSize: number;
};
export declare class TextGeometry extends ExtrudeGeometry {
    private _text;
    options: TextGeometryArgs;
    constructor(text: string, options: TextGeometryArgs);
    get font(): Font;
    get text(): string;
    get fontSize(): number;
    set fontSize(v: number);
    set text(v: string);
    protected buildShape(path: any): void;
}
