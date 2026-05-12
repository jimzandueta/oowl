import kleur from 'kleur'

const COMMANDS: Record<string, (args: string[]) => Promise<void>> = {
  init: args => import('./commands/init.js').then(m => m.init(args)),
  profile: () => import('./commands/profile.js').then(m => m.profile()),
  update: () => import('./commands/update.js').then(m => m.update()),
}

function printHelp(): void {
  console.log(`
${kleur.bold('oowl')} — OpenCode Opinionated Workflow Layer

${kleur.bold('Usage:')}
  oowl <command>

${kleur.bold('Commands:')}
  ${kleur.cyan('init')}     Install the OOWL multi-agent framework
  ${kleur.cyan('profile')}  Switch to a different model cost profile
  ${kleur.cyan('update')}   Update framework files to the latest version

${kleur.bold('Examples:')}
  npx @jimzandueta/oowl init
  oowl profile
  oowl update
`)
}

export async function run(args: string[]): Promise<void> {
  const cmd = args[0]

  if (!cmd || cmd === '--help' || cmd === '-h') {
    printHelp()
    return
  }

  if (!COMMANDS[cmd]) {
    console.error(kleur.red(`Unknown command: ${cmd}`))
    printHelp()
    process.exitCode = 1
    return
  }

  try {
    await COMMANDS[cmd](args.slice(1))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(kleur.red(`Error: ${message}`))
    process.exitCode = 1
  }
}
