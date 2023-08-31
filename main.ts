import { App, Modal, Plugin, Setting } from "obsidian";

export default class ObsidianADS extends Plugin {
    async onload() {
        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: "open-sample-modal-simple",
            name: "Open sample modal (simple)",
            callback: () => {
                new BibInput(this.app, (input) => {
                    console.log(input);
                }).open();
            },
        });
    }

    onunload() {}
}

export class BibInput extends Modal {
    result: string;
    onSubmit: (result: string) => void;

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h1", { text: "ADS link / Bibcode:" });

        new Setting(contentEl).setName("Link").addText((text) =>
            text.onChange((value) => {
                this.result = value;
            })
        );

        new Setting(contentEl).addButton((btn) =>
            btn
                .setButtonText("Submit")
                .setCta()
                .onClick(() => {
                    this.close();
                    this.onSubmit(this.result);
                })
        );
        contentEl.addEventListener("keyup", (e) => {
            if (e.key === "Enter" && this.result) {
                this.close();
                this.onSubmit(this.result);
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
