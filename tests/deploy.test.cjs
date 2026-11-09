const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash';
test('OPS-T02 rollback records active SHA and never rolls back twice after deploy failure',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'brewlite-deploy-'));
 const bin=path.join(dir,'bin');fs.mkdirSync(bin);
 fs.writeFileSync(path.join(bin,'docker'),'#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> "$DEPLOY_DIR/commands"\nexit 0\n',{mode:0o755});
 fs.writeFileSync(path.join(bin,'flock'),'#!/usr/bin/env bash\nexit 0\n',{mode:0o755});
 const a='a'.repeat(40),b='b'.repeat(40);
 fs.writeFileSync(path.join(dir,'.current-tag'),b+'\n');
 fs.writeFileSync(path.join(dir,'.previous-tag'),a+'\n');
 const res=spawnSync(bash,[path.join(root,'deploy/rollback.sh')],{env:{...process.env,DEPLOY_DIR:dir,PATH:bin+path.delimiter+process.env.PATH},encoding:'utf8'});
 assert.equal(res.status,0,res.stdout+res.stderr);
 assert.equal(fs.readFileSync(path.join(dir,'.current-tag'),'utf8').trim(),a);
 assert.equal(fs.readFileSync(path.join(dir,'.failed-tag'),'utf8').trim(),b);
 const cd=fs.readFileSync(path.join(root,'.github/workflows/cd.yml'),'utf8');
 assert.match(cd,/steps\.deploy\.outcome == 'success'/);
 assert.match(cd,/steps\.smoke\.outcome == 'failure'/);
 fs.rmSync(dir,{recursive:true,force:true});
});

test('OPS-T02 deployment waits for PostgreSQL before backup and restores current image on migration failure',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'brewlite-deploy-'));
 const bin=path.join(dir,'bin');fs.mkdirSync(bin);
 fs.writeFileSync(path.join(bin,'docker'),`#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$DEPLOY_DIR/commands"
if [[ "$*" == *"up -d --wait --wait-timeout 120 db"* ]]; then touch "$DEPLOY_DIR/db-ready"; fi
if [[ "$*" == *"pg_dump"* ]]; then test -f "$DEPLOY_DIR/db-ready" || exit 5; fi
if [[ "$*" == *"run --rm --no-deps api npm run db:deploy"* ]]; then exit 9; fi
exit 0
`,{mode:0o755});
 fs.writeFileSync(path.join(bin,'flock'),'#!/usr/bin/env bash\nexit 0\n',{mode:0o755});
 const a='a'.repeat(40),b='b'.repeat(40);
 fs.writeFileSync(path.join(dir,'.current-tag'),a+'\n');
 const res=spawnSync(bash,[path.join(root,'deploy/deploy.sh'),b],{env:{...process.env,DEPLOY_DIR:dir,PATH:bin+path.delimiter+process.env.PATH},encoding:'utf8'});
 assert.equal(res.status,1,res.stdout+res.stderr);
 assert.ok(fs.existsSync(path.join(dir,'db-ready')));
 assert.match(fs.readFileSync(path.join(dir,'commands'),'utf8'),/up -d --no-deps api web/);
 assert.equal(fs.readFileSync(path.join(dir,'.current-tag'),'utf8').trim(),a);
 fs.rmSync(dir,{recursive:true,force:true});
});
