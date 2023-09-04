import bibtexParse from "bibtex-parse-js";
import {
	App,
	Modal,
	Notice,
	Plugin,
	Setting,
	Vault,
	requestUrl,
} from "obsidian";
// @ts-ignore
import { dump } from "js-yaml";
import { key } from "./adskey";
interface BibInfo {
	title: string;
	authors: [string, string][];
	year: number;
	journal: string;
	ADSlink: string;
}

type Bibcode = string;

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
	const properties = {
		tags: ["paper"],
		pdf: "",
		title: bibInfo.title,
		authors: bibInfo.authors.map((a) => a.join(" ")),
		year: bibInfo.year,
		journal: bibInfo.journal,
		ads: bibInfo.ADSlink,
	};
	const yaml = dump(properties);
	const content = "---\n" + yaml + "---\n";

	vault.create(noteName, content);
}

function getBibCode(input: string): Bibcode | null {
	if (input.includes("ui.adsabs.harvard.edu/abs/")) {
		const l = input.split("/");
		const i = l.indexOf("ui.adsabs.harvard.edu") + 2;
		return l[i];
	} else if (!isNaN(Number(input.slice(0, 4)))) {
		return input;
	} else {
		return null;
	}
}

function parseBibTex(bibtex: string): BibInfo {
	const { entryTags } = bibtexParse.toJSON(bibtex)[0];
	const title = entryTags.title.replace("{", "").replace("}", "");
	const authors = entryTags.author.split(" and ").map((a: string) => {
		const [last, first] = a.split(", ");
		return [first, last.replace("{", "").replace("}", "")];
	});
	const year = Number(entryTags.year);
	const journal = entryTags.journal;
	const ADSlink = entryTags.adsurl;
	return {
		title,
		authors,
		year,
		journal,
		ADSlink,
	};
}

async function requestBibInfo(bibcode: Bibcode): Promise<BibInfo> {
	console.log(bibcode);
	const response = await requestUrl({
		url: "https://api.adsabs.harvard.edu/v1/export/bibtex",
		headers: {
			Authorization: "Bearer " + key,
		},
		method: "POST",
		contentType: "application/json",
		body: JSON.stringify({
			bibcode: [bibcode],
		}),
	});
	console.log("response", response)
	if (response.status !== 200) {
		throw new Error("Request failed");
	}
	const data = response.json;
	return parseBibTex(data.export);
}

export default class ObsidianADS extends Plugin {
	async onload() {
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "create-note-from-ads-link",
			name: "Create note from ADS link",
			callback: () => {
				new BibInput(this.app, (input) => {
					const bibcode = getBibCode(input);
					if (!bibcode) {
						new Notice("Invalid input");
						return;
					}
					requestBibInfo(bibcode).then((bibInfo) => {
						createBibNote(this.app.vault, bibInfo);
					});
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
