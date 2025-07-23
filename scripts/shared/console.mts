import chalk, { ChalkInstance } from 'chalk';
import symbols from 'log-symbols';
import ora, { Ora } from 'ora';

import { Console as NodeConsole } from 'node:console';
import * as tty from 'node:tty';
import { inspect } from 'node:util';

enum WriteType {
	INFO = 'info',
	SUCCESS = 'success',
	WARNING = 'warning',
	ERROR = 'error',
}

interface ConsoleOptions {
	name?: string;
	color?: ChalkInstance;
}

const { env = {}, argv = [], platform = '' } = typeof process === 'undefined' ? {} : process;

const isDisabled = 'NO_COLOR' in env || argv.includes('--no-color');
const isForced = 'FORCE_COLOR' in env || argv.includes('--color');
const isWindows = platform === 'win32';
const isDumbTerminal = env.TERM === 'dumb';

const isCompatibleTerminal = tty && tty.isatty && tty.isatty(1) && env.TERM && !isDumbTerminal;

const isCI = 'CI' in env && ('GITHUB_ACTIONS' in env || 'GITLAB_CI' in env || 'CIRCLECI' in env);

const isColorSupported = !isDisabled && (isForced || (isWindows && !isDumbTerminal) || isCompatibleTerminal || isCI);

class Console {
	private readonly name: string;
	private readonly colour: ChalkInstance;
	private readonly console: globalThis.Console = new NodeConsole(process.stdout, process.stderr);

	constructor(options: ConsoleOptions = {}) {
		this.name = options.name ?? 'script';
		this.colour = options.color ?? chalk.hex('#A327F0');
	}

	protected preprocess(...content: readonly unknown[]) {
		const time: string = new Intl.DateTimeFormat('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		}).format(new Date());

		const values = content
			.map((value) =>
				typeof value === 'string' ? value : inspect(value, { colors: isColorSupported, depth: 3 })
			)
			.join(' ');

		return values
			.split('\n')
			.map((line: string) => [chalk.gray(time), chalk.bold(this.colour(`[${this.name}]`)), line].join(' '))
			.join('\n');
	}

	public write(type: WriteType, ...content: readonly unknown[]): void {
		let logger: 'info' | 'warn' | 'error' = 'info';

		if (type === WriteType.SUCCESS) logger = 'info';
		else if (type === WriteType.WARNING) logger = 'warn';
		else if (type === WriteType.ERROR) logger = 'error';
		else logger = 'info';

		return (this.console[logger] as (...args: any[]) => void)(this.preprocess(symbols[type], ...content));
	}

	public info(...content: readonly unknown[]): void {
		return this.write(WriteType.INFO, ...content);
	}

	public success(...content: readonly unknown[]): void {
		return this.write(WriteType.SUCCESS, ...content);
	}

	public warning(...content: readonly unknown[]): void {
		return this.write(WriteType.WARNING, ...content);
	}

	public error(...content: readonly unknown[]): void {
		return this.write(WriteType.ERROR, ...content);
	}

	public promise(...content: readonly string[]): Ora {
		return ora({
			text: content.join(' '),
			prefixText: () => {
				const time: string = new Intl.DateTimeFormat('en-GB', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false,
				}).format(new Date());

				return [chalk.gray(time), chalk.bold(this.colour(`[${this.name}]`))].join(' ');
			},
			spinner: 'dots12',
		});
	}
}

export { Console, ConsoleOptions, WriteType };

