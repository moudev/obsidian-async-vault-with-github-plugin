# Sync vault with GitHub

Obsidian **desktop** plugin to sync the obsidian vault with GitHub. **Only tested with one vault**.

## Requirements

- Install [`git`](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- Install [`node.js`](https://nodejs.org/en/) and `npm`

## Manually installing the plugin

- Download the `.zip` file from the _releases_ page. Chose the last version plublished
- Unzip the file and copy their content in the _plugins/_ directory of your vault. `VaultFolder/.obsidian/plugins/`
- Enable the plugin from _Obsidian_ settings in the _Community plugins_ option
- Follow _Plugin configurations_

## Plugin configurations

This plugin has two things to configure. The **GitHub url repository** and **files to ignore**. Only the first is required and the other is optional.

### Config the GitHub URL repository (required)

- Make sure to install the _requirements_
- Configure the [GitHub credentials](https://docs.github.com/en/get-started/quickstart/set-up-git) in your computer
- Create a GitHub repository with the name that you want. It can be public or private
- Click on the green button "<> Code" and copy de "HTTPS" link. Example: `https://github.com/username/my-obsidian-vault.git`
- Open _Obsidian settings_ and click in the _Plugins community_ section click in the plugin name
- Paste the _HTTPS_ link in the _GitHub URL repository_ field and click on "Configure repository"

### Config the files to ignore (optional)

It's the content of the `.gitignore` file. One line for file. You can use all the [gitignore patterns](https://git-scm.com/docs/gitignore). All the files added in this field won't be tracked for changes

Example:

```markdown
# .gitignore file
ignore-specific-file.md
.obsidian-directory/
```

## Make a backup

- In the _Obsidian_ sidebar you will see a list of icons. Click on the icon that has the tooltip "Sync vault with GitHub"
- A modal will be open with the list of files that has changes from the last backup. If there is not changes then the button submit won't be displayed
- You can change the "commit message"
- Click on the submit button and the changes will be upload to the GitHub repository
- **Note:** only will be listed the files that aren't in the _files to ignore_ field of the plugin configurations

## Development

- Open a terminal in the path of the obsidian's vault
- Enter in the `.obsidian/plugins/` directory
- Clone this repo with `git clone`
- Enter in the repository directory
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode
- Enable the plugin from _Obsidian_ settings in the _Community plugins_ option
- Complete _Plugin configurations_
