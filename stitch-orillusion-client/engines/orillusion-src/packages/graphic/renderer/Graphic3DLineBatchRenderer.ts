import { GPUPrimitiveTopology } from "@engine/core";
import { Graphic3DBatchRenderer } from "./Graphic3DBatchRenderer";

/**
 * @internal
 */
export class Graphic3DLineRenderer extends Graphic3DBatchRenderer {
    constructor() {
        super(2, GPUPrimitiveTopology.line_list);
    }
}
