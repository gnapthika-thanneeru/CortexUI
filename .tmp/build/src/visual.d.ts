import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private target;
    private chatContainer;
    private inputBox;
    private sendButton;
    private answerBox;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private askPythonBackend;
    private renderResponse;
    private formatMarkdown;
    private renderTable;
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
