import { App, Modal, Plugin, Setting, Vault } from "obsidian";
import dedent from "ts-dedent";
interface BibInfo {
	title: string;
	authors: [string, string][];
	year: number;
	journal: string;
	ADSlink: string;
}

function getBibInfo(link: string): BibInfo {
	return {
		title: "title",
		authors: [
			["Jinmi", "Yoon"],
			["Timothy C.", "Beers"],
		],
		year: 2021,
		journal: "journal",
		ADSlink: link,
	};
}

function getNoteName(bibInfo: BibInfo): string {
	if (bibInfo.authors.length > 2) {
		return `${bibInfo.authors[0][1]} et al. ${bibInfo.year}`;
	} else if (bibInfo.authors.length === 2) {
		return `${bibInfo.authors[0][1]} & ${bibInfo.authors[1][1]} ${bibInfo.year}`;
	} else {
		return `${bibInfo.authors[0][1]} ${bibInfo.year}`;
	}
}

function createBibNote(vault: Vault, bibInfo: BibInfo) {
	const noteName = getNoteName(bibInfo) + ".md";
	const content = dedent`
    #paper
    pdf::
    title::${bibInfo.title}
    authors::${bibInfo.authors.map((a) => a.join(" ")).join(", ")}
    year::${bibInfo.year}
    journal::${bibInfo.journal}
    ads::${bibInfo.ADSlink}
    `;
	console.log("creating note", noteName);
	vault.create(noteName, content);
}

export default class ObsidianADS extends Plugin {
	async onload() {
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "create-note-from-ads-link",
			name: "Create note from ADS link",
			callback: () => {
				new BibInput(this.app, (input) => {
					const bibInfo = getBibInfo(input);
					createBibNote(this.app.vault, bibInfo);
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
