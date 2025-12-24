declare module "sql.js" {
  interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  interface QueryResults {
    columns: string[];
    values: any[][];
  }

  class Database {
    constructor(data?: Uint8Array);
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): QueryResults[];
    prepare(sql: string, params?: any[]): Statement;
    export(): Uint8Array;
    close(): void;
  }

  class Statement {
    bind(values?: any[]): void;
    step(): boolean;
    get(): any[];
    getAsObject(): Record<string, any>;
    free(): void;
  }

  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export default function initSqlJs(
    config?: SqlJsConfig
  ): Promise<SqlJsStatic>;
}