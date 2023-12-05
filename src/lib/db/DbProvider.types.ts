export type UserProperties = {
	readonly score: number,
	readonly name?: string,
	readonly params?: string,
}
export type UserData = {readonly userId: string} & UserProperties;
export type TopData = Array<UserData>;

export type DBProviderConfig = {isDebug?: boolean} & {[key: string]: unknown};
export interface IDbProvider {
	Initialize(config: DBProviderConfig): Promise<void>;
	Put(gameId: string, userId: string, userProp: UserProperties): Promise<void>;
	Delete(gameId: string, userId: string): Promise<void>;
	Get(gameId: string, userId: string): Promise<UserProperties | null>;
	Top(gameId: string, nTop: number): Promise<TopData>
	Shutdown(): Promise<void>;
}
