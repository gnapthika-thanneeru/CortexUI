"use strict";

import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

export class Visual implements IVisual {
    private target: HTMLElement;
    private messagesBox: HTMLDivElement;
    private inputBox: HTMLTextAreaElement;
    private sendButton: HTMLButtonElement;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;

        while (this.target.firstChild) {
            this.target.removeChild(this.target.firstChild);
        }

        const wrapper = document.createElement("div");
        wrapper.className = "chat-wrapper";

        const title = document.createElement("div");
        title.className = "chat-title";
        title.textContent = "Agent Chat";

        this.messagesBox = document.createElement("div");
        this.messagesBox.className = "chat-messages";

        const inputArea = document.createElement("div");
        inputArea.className = "chat-input-area";

        this.inputBox = document.createElement("textarea");
        this.inputBox.className = "chat-input";
        this.inputBox.placeholder = "Ask anything...";

        this.sendButton = document.createElement("button");
        this.sendButton.className = "chat-button";
        this.sendButton.textContent = "Send";

        this.sendButton.onclick = async () => {
            await this.askPythonBackend();
        };

        this.inputBox.addEventListener("keydown", async (event: KeyboardEvent) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                await this.askPythonBackend();
            }
        });

        inputArea.appendChild(this.inputBox);
        inputArea.appendChild(this.sendButton);

        wrapper.appendChild(title);
        wrapper.appendChild(this.messagesBox);
        wrapper.appendChild(inputArea);

        this.target.appendChild(wrapper);
    }

    public update(options: VisualUpdateOptions): void {
        console.log("Visual update", options);
    }

    private async askPythonBackend(): Promise<void> {
        const userQuestion = this.inputBox.value.trim();

        if (!userQuestion) {
            return;
        }

        this.addMessage(userQuestion, "user");
        this.inputBox.value = "";

        const loadingMessage = this.addMessage("Thinking...", "bot");

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

            loadingMessage.remove();

            if (data.answer) {
                this.addMessage(data.answer, "bot");
            }

            if (data.chart) {
                this.addMessage(JSON.stringify(data.chart, null, 2), "bot");
            }

            if (data.tables && Array.isArray(data.tables)) {
                this.addMessage(JSON.stringify(data.tables, null, 2), "bot");
            }

        } catch (error) {
            console.error(error);
            loadingMessage.remove();
            this.addMessage(
                "Error: Could not connect to Python backend. Make sure uvicorn is running on port 8000.",
                "bot"
            );
        }
    }

    private addMessage(text: string, sender: "user" | "bot"): HTMLDivElement {
        const row = document.createElement("div");
        row.className = sender === "user" ? "message-row user-row" : "message-row bot-row";

        const bubble = document.createElement("div");
        bubble.className = sender === "user" ? "message-bubble user-bubble" : "message-bubble bot-bubble";

        const formattedText = text
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .split("\n");

        formattedText.forEach((line, index) => {
            if (index > 0) {
                bubble.appendChild(document.createElement("br"));
            }
            bubble.appendChild(document.createTextNode(line));
        });

        row.appendChild(bubble);
        this.messagesBox.appendChild(row);

        this.messagesBox.scrollTop = this.messagesBox.scrollHeight;

        return row;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return {
            cards: []
        };
    }
}