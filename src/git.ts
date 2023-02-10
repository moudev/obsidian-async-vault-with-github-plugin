// Error for both imports:  You can mark the path "node:util" as external to exclude it from the bundle, which will remove this error.
// https://github.com/pluvial/svelte-adapter-deno/issues/14#issuecomment-987225812
// https://esbuild.github.io/api/#external in "js" tab
import { exec } from "node:child_process"
import { promisify } from "node:util"

const _exec = promisify(exec)

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

const executeGitCommand = async(command: string, vault: string):Promise<string> => {
  try {
    await createRepository(vault)

    const { stdout, stderr } = await _exec(`git -C ${vault} ${command}`)

    return Promise.resolve(stdout || stderr)
  } catch (error) {
    return Promise.reject(error)
  }
}

export { isGitInstalled, createRepository, executeGitCommand }