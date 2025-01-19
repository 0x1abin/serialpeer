/*
Prints log messages depending on the debug level passed in. Defaults to 0.
0  Prints no logs.
1  Prints only errors.
2  Prints errors and warnings.
3  Prints all logs.
*/
export enum LogLevel {
	/**
	 * Prints no logs.
	 */
	Disabled,
	/**
	 * Prints only errors.
	 */
	Errors,
	/**
	 * Prints errors and warnings.
	 */
	Warnings,
	/**
	 * Prints info logs.
	 */
	Info,
	/**
	 * Prints debug logs.
	 */
	Debug,
	/**
	 * Prints all logs.
	 */
	All,
}

export class Logger {
	tag: string;
	private _logLevel = LogLevel.Debug;

	constructor(tag: string = "LOG") {
		this.tag = `[${tag}]:`;
	}

	get logLevel(): LogLevel {
		return this._logLevel;
	}

	set logLevel(logLevel: LogLevel) {
		this._logLevel = logLevel;
	}

	trace(...args: any[]) {
		if (this._logLevel >= LogLevel.All) {
			this._print(LogLevel.All, ...args);
		}
	}

	debug(...args: any[]) {
		if (this._logLevel >= LogLevel.Debug) {
			this._print(LogLevel.Debug, ...args);
		}
	}

	info(...args: any[]) {
		if (this._logLevel >= LogLevel.Info) {
			this._print(LogLevel.Info, ...args);
		}
	}

	warn(...args: any[]) {
		if (this._logLevel >= LogLevel.Warnings) {
			this._print(LogLevel.Warnings, ...args);
		}
	}

	error(...args: any[]) {
		if (this._logLevel >= LogLevel.Errors) {
			this._print(LogLevel.Errors, ...args);
		}
	}

	setLogFunction(fn: (logLevel: LogLevel, ..._: any[]) => void): void {
		this._print = fn;
	}

	private _print(logLevel: LogLevel, ...rest: any[]): void {
		const copy = [this.tag, ...rest];

		for (const i in copy) {
			if (copy[i] instanceof Error) {
				copy[i] = "(" + copy[i].name + ") " + copy[i].message;
			}
		}

		if (logLevel >= LogLevel.All) {
			console.trace(...copy);
		} else if (logLevel >= LogLevel.Debug) {
			console.log("D", ...copy);
		} else if (logLevel >= LogLevel.Info) {
			console.info("I", ...copy);
		} else if (logLevel >= LogLevel.Warnings) {
			console.warn("W", ...copy);
		} else if (logLevel >= LogLevel.Errors) {
			console.error("E", ...copy);
		}
	}
}
