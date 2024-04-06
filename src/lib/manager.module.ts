import { DynamicModule, Type } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

import { CoreModule } from './core.module';

export class ManagerModule {
	static async AddControllersFromDir(dirName: string): Promise<Type[]> {
		const controllers: Type[] = [];
		const files = fs.readdirSync(path.resolve(__dirname, '..', dirName));

		for (const file of files) {
			if (!/controller.(t|j)s$/.test(file)) {
				continue;
			}
			const { default: controllerClass } = await import(`${__dirname}/../${dirName}/${path.parse(file).name}`);
			controllers.push(controllerClass);
		}

		return controllers;
	}

	static async register(dirName: string): Promise<DynamicModule> {
		const controllers = await ManagerModule.AddControllersFromDir(dirName);
		return {
			module: ManagerModule,
			imports: [CoreModule],
			providers: [],
			controllers: controllers,
		};
	}
}
