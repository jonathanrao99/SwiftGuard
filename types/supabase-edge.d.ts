// TypeScript declarations for Supabase Edge Functions
// These are server-side Deno environment functions and don't affect the React Native app

declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve(handler: (req: Request) => Response | Promise<Response>): void;
  };
}

// Suppress module resolution errors for Deno imports
declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): any;
}

declare module 'https://deno.land/x/stripe@v0.1.0/mod.ts' {
  export class Stripe {
    constructor(key: string);
    paymentIntents: any;
    setupIntents: any;
    accounts: any;
  }
} 