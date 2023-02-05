import { App, Modal } from "obsidian"

// https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/1.8.12/src/dialogs/Prompt.ts#L18
class AsyncModal extends Modal {
	defaultCommitMessage: string
  constructor(app: App) {
    super(app)
		this.defaultCommitMessage = `async from ${new Date()}`
  }

  onOpen() {
    const { contentEl } = this

    contentEl.createEl("h1", { text: "Async vault with GitHub" })

		const div = contentEl.createDiv()

		const form = div.createEl("form")
    form.addClass("async-form")
    form.type = "submit"
    form.onsubmit = (e) => {
      e.preventDefault()
			console.log("Submit", messageInput.value)
    }

		form.createEl("label").setText("Commit message:")
    const messageInput = form.createEl("input")
    messageInput.type = "text"
		messageInput.setAttr("name", "commit-message")
		messageInput.value = this.defaultCommitMessage
    messageInput.select()		

		const formActions = form.createDiv()
		formActions.addClass("async-form-actions")

		const submitButton = formActions.createEl("button")
		submitButton.setText("Submit")
    submitButton.addClass("mod-cta")
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}

export { AsyncModal } 