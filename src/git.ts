// Error for both imports:  You can mark the path "node:util" as external to exclude it from the bundle, which will remove this error.
// https://github.com/pluvial/svelte-adapter-deno/issues/14#issuecomment-987225812
// https://esbuild.github.io/api/#external in "js" tab
import { exec } from "node:child_process"
import { platform } from "node:os"
import { promisify } from "node:util"

const _exec = promisify(exec)

// https://github.com/Taitava/obsidian-shellcommands/blob/627d3b4a36300654bf32c7afe0aea1b24c77351f/src/Common.ts#L69
const isWindows = () => {
  return platform() === "win32"
}

const isGitInstalled = async () => {
  try {
    const { stdout, stderr } = await _exec("git --version")

    if (stderr) {
      return Promise.reject(stderr)
    }

    return Promise.resolve(stdout)
  } catch (error) {
    return Promise.reject(error.message)
  }
}

const createRepository = async (vault: string) => {
  try {
    await isGitInstalled()

    // execute commands from another path
    // https://stackoverflow.com/questions/13430613/how-to-use-git-from-another-directory
    const { stdout, stderr } = await _exec(`git -C ${vault} init`)
    if (stderr) {
      return Promise.reject(stderr)
    }
    return Promise.resolve(stdout)
  } catch (error) {
    return Promise.reject("Repository was not created")
  }
}

const deleteRepository = async (vault: string) => {
  try {
    // for windows: https://stackoverflow.com/questions/17369850/how-to-remove-git-repository-created-on-desktop
    const commandString = isWindows() ? `rmdir /s /q ${vault}\\.git` : `rm -rf ${vault}/.git`
    const { stdout, stderr } = await _exec(commandString)

    if (stderr) {
      return Promise.reject(stderr)
    }

    return Promise.resolve(stdout)
  } catch (error) {
    return Promise.reject(error)
  }
}

const executeGitCommand = async(command: string, vault: string):Promise<string> => {
  try {
    await createRepository(vault)

    const { stdout, stderr } = await _exec(`git -C ${vault} ${command}`)

    return Promise.resolve(stdout || stderr)
  } catch (error) {
    return Promise.reject(error)
  }
}

  const isRemoteOriginAdded = async (vault: string): Promise<boolean> => {
		try {
			const remoteOrigin = await executeGitCommand("remote -v", vault)
			return Promise.resolve(remoteOrigin.contains("origin"))
		} catch (error) {
			return Promise.resolve(false)
		}
	}

	const existCommits = async (vault: string): Promise<boolean> => {
		try {
			await executeGitCommand("log", vault)
			return Promise.resolve(true)
		} catch (error) {
			return Promise.resolve(false)
		}
	}

export { isGitInstalled, createRepository, deleteRepository, executeGitCommand, isRemoteOriginAdded, existCommits }