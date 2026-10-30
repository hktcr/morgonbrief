import {readFile} from 'node:fs/promises';
import {validateEdition} from '../assets/model.mjs';
const path=process.argv[2] || 'data/latest.json';
try { const data=JSON.parse(await readFile(path,'utf8'));const errors=validateEdition(data);if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`VALID ${data.editionId}: ${data.stories.length} stories; ${data.status}; window ${data.windowStart} — ${data.windowEnd}`); }catch(e){console.error(e.message);process.exitCode=1;}
