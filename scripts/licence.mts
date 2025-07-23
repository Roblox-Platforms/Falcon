/**
 * @file licence.mts
 * @executable
 * @author ninjaninja140
 * @description Generates a LICENCE.luau file from the LICENCE file in the project root and stores it inside the `build` folder.
 * @version 1.0.0
 */

import { constants } from 'node:fs';
import fs, { access } from 'node:fs/promises';
import path from 'node:path';

import { Console } from './shared/console.mjs';

const console = new Console({ name: 'licence-builder' });
const dir = process.cwd();

const exists = async (path: string): Promise<boolean> => {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
};

console.info('Running licence builder...');

const progress = console.promise('Looking for LICENCE file...');
progress.start();

if (!(await exists(path.resolve(dir, 'LICENCE')))) {
	progress.fail('Could not find LICENCE file...');
	console.error("The target LICENCE file was not found, or doesn't exist, exiting...");
	process.exit(1);
}

progress.text = 'Found licence file, processing...';

let licence = await fs.readFile(path.resolve(dir, 'LICENCE'), { encoding: 'utf-8' });

// Indent by 1 tab space
licence = licence
	.split('\n')
	.map((line) => '\t' + line)
	.join('\n');

// Remove trailing tab or return spaces
licence = licence.replace(/\t+$/, '');
licence = licence.replace(/\n+$/, '');

const content: Array<string> = [];

content.push('--[[');
content.push('');
content.push(`\tGenerated at ${new Date().toISOString()} from LICENCE`);
content.push(`\tFalcon Engine Licence ${new Date().getFullYear()} (MIT)`);
content.push('');
content.push(licence);
content.push('--]]');
content.push('');
content.push('return {}');

progress.text = 'Processed file, checking for build folder...';

if (!(await exists(path.resolve(dir, 'build')))) {
	progress.fail('Missing build folder, this script should be ran post build!');
	console.error(
		'The target build folder was not found, so the licence file cannot be stored, please make sure the build folder exists, and that this script is ran post-build.'
	);
	process.exit(1);
}

progress.text = 'Checking and removing existing copies...';

if (await exists(path.resolve(dir, 'build', 'LICENCE.luau')))
	await fs.rm(path.resolve(dir, 'build', 'LICENCE.luau'), { force: true });

progress.text = 'Saving to build folder...';

try {
	await fs.writeFile(path.resolve(dir, 'build', 'LICENCE.luau'), content.join('\n'), { encoding: 'utf-8' });
} catch (error) {
	progress.fail('Failed to save licence.');
	console.error('Failed to save licence file, Node.js returned the following error:', '\n', error);
	process.exit(1);
}

progress.succeed('Successfully processed and saved file!');
console.info('Saved to build/LICENCE.luau');

