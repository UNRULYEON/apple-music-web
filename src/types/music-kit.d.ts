declare namespace MusicKit {
  interface MusicKitInstance {
    isAuthorized: boolean;
    musicUserToken: string;
    authorize(): Promise<string>;
    unauthorize(): Promise<void>;
    api: {
      music(path: string, query?: Record<string, unknown>): Promise<{ data: unknown }>;
    };
  }

  function configure(options: {
    developerToken: string;
    app: { name: string; build: string };
  }): Promise<MusicKitInstance>;

  function getInstance(): MusicKitInstance;
}

interface Window {
  MusicKit?: typeof MusicKit;
}
