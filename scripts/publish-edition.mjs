// Stages a fully reviewed candidate locally; publication still requires the repository release gates.
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {validateEdition} from '../assets/model.mjs';
const path=process.argv[2];if(!path)throw new Error('Usage: node scripts/publish-edition.mjs candidate.json');
const text=await readFile(path,'utf8'),next=JSON.parse(text);const errors=validateEdition(next);if(errors.length)throw new Error(errors.join('\n'));
let previous;try{previous=JSON.parse(await readFile('data/latest.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(previous && Date.parse(next.windowEnd)<=Date.parse(previous.windowEnd))throw new Error('Refusing duplicate/older edition. Corrections must preserve the original timestamp and use an explicitly reviewed correction flow.');
if(previous?.stories.length && next.status==='empty')throw new Error('Empty candidate cannot replace the last successful edition. Preserve latest; record failed attempt privately.');
await mkdir('archive',{recursive:true});await mkdir('data',{recursive:true});
const serialized=JSON.stringify(next,null,2)+'\n';
// Write candidate archive first. Refuse silent overwrite of an existing edition.
await writeFile(`archive/${next.editionId}.json`,serialized,{flag:'wx'});
await writeFile('data/latest.json.tmp',serialized);await rename('data/latest.json.tmp','data/latest.json');
console.log(`Staged ${next.editionId}. Run npm run check, independent release review, then commit archive and latest atomically.`);
