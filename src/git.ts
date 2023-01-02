// Error for both imports:  You can mark the path "node:util" as external to exclude it from the bundle, which will remove this error.
// https://github.com/pluvial/svelte-adapter-deno/issues/14#issuecomment-987225812
// https://esbuild.github.io/api/#external in "js" tab
import { exec } from "node:child_process"
import { promisify } from "node:util"

const _exec = promisify(exec)

const isGitInstalled = async () => {
  try {
    const { stdout, stderr } = await _exec("git --version")

    console.log("stdout", stdout)
    console.log("stderr", stderr)

    if (stderr) {
      return false
    }
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const executeGitCommand = async(command: string):Promise<string> => {
  try {
    const isGitAvailable = await isGitInstalled()
    if (!isGitAvailable) {
      return Promise.reject("Error. Install git")
    }

    const { stdout, stderr } = await _exec(command)

    if (stderr) {
      return Promise.reject(stderr)
    }

    return Promise.resolve(stdout)
  } catch (error) {
    console.log("executeGitCommand error:", error)
    return Promise.reject("Error. Install git")
  }
}

const getGitHelp = async ():Promise<string> => {
  const result = await executeGitCommand("git --help")
  return result
}

export { isGitInstalled, executeGitCommand, getGitHelp }