"use strict";

import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

export class Visual implements IVisual {
    private target: HTMLElement;
    private chatContainer: HTMLDivElement;
    private inputBox: HTMLTextAreaElement;
    private sendButton: HTMLButtonElement;
    private answerBox: HTMLDivElement;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.target.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.className = "chat-wrapper";

        const title = document.createElement("div");
        title.className = "chat-title";
        title.innerText = "Agent Python Proxy Chat";

        this.chatContainer = document.createElement("div");
        this.chatContainer.className = "chat-container";

        this.inputBox = document.createElement("textarea");
        this.inputBox.className = "chat-input";
        this.inputBox.placeholder = "Ask a question...";

        this.sendButton = document.createElement("button");
        this.sendButton.className = "chat-button";
        this.sendButton.innerText = "Send";

        this.answerBox = document.createElement("div");
        this.answerBox.className = "chat-answer";

        this.sendButton.onclick = async () => {
            await this.askPythonBackend();
        };

        wrapper.appendChild(title);
        wrapper.appendChild(this.inputBox);
        wrapper.appendChild(this.sendButton);
        wrapper.appendChild(this.answerBox);

        this.target.appendChild(wrapper);
    }

    public update(options: VisualUpdateOptions): void {
        console.log("Visual update", options);
    }

    private async askPythonBackend(): Promise<void> {
        const userQuestion = this.inputBox.value.trim();

        if (!userQuestion) {
            this.answerBox.innerHTML = "<p>Please enter a question.</p>";
            return;
        }

        this.answerBox.innerHTML = "<p>Thinking...</p>";

        try {
            const response = await fetch("http://localhost:8000/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: userQuestion
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            this.renderResponse(data);
        } catch (error) {
            console.error(error);
            this.answerBox.innerHTML = `
                <p><strong>Error:</strong> Could not connect to Python backend.</p>
                <p>Make sure this is running:</p>
                <pre>python -m uvicorn app:app --host 0.0.0.0 --port 8000</pre>
            `;
        }
    }

    private renderResponse(data: any): void {
        this.answerBox.innerHTML = "";

        if (data.answer) {
            const answer = document.createElement("div");
            answer.className = "answer-text";
            answer.innerHTML = this.formatMarkdown(data.answer);
            this.answerBox.appendChild(answer);
        }

        if (data.chart) {
            const chart = document.createElement("div");
            chart.className = "chart-container";

            if (typeof data.chart === "string") {
                chart.innerHTML = data.chart;
            } else {
                chart.innerHTML = `<pre>${JSON.stringify(data.chart, null, 2)}</pre>`;
            }

            this.answerBox.appendChild(chart);
        }

        if (data.tables && Array.isArray(data.tables)) {
            data.tables.forEach((tableData: any) => {
                const tableElement = this.renderTable(tableData);
                this.answerBox.appendChild(tableElement);
            });
        }
    }

    private formatMarkdown(text: string): string {
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");
    }

    private renderTable(tableData: any): HTMLElement {
        const tableWrapper = document.createElement("div");
        tableWrapper.className = "table-wrapper";

        const table = document.createElement("table");

        if (Array.isArray(tableData) && tableData.length > 0) {
            const headers = Object.keys(tableData[0]);

            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            headers.forEach(header => {
                const th = document.createElement("th");
                th.innerText = header;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            tableData.forEach(row => {
                const tr = document.createElement("tr");

                headers.forEach(header => {
                    const td = document.createElement("td");
                    td.innerText = row[header];
                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
        }

        tableWrapper.appendChild(table);
        return tableWrapper;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return {
            cards: []
        };
    }
}