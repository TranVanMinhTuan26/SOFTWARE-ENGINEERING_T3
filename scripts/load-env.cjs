const fs=require('node:fs');
const {spawn}=require('node:child_process');
const path=require('node:path');
const [file,command,...args]=process.argv.slice(2);
if (!file || !command) throw new Error('Usage: node scripts/load-env.cjs .env.test <executable> [args]');
for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
  const match=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if(match) process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
}
// Invoke npm through Node so arguments never pass through a shell.
let executable=command;
if (/^npm(?:\.cmd)?$/.test(command)) {
  executable=process.execPath;
  const npmCli=process.env.npm_execpath || path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
  args.unshift(npmCli);
}
const child=spawn(executable,args,{stdio:'inherit',env:process.env,shell:false});
child.on('error',err=>{console.error(err.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code ?? 1;});
