type CreateClient = (supabaseUrl: string, serviceRoleKey: string) => unknown;

let createClient: CreateClient | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access
  ({ createClient } = require("@supabase/supabase-js"));
} catch (error) {
  console.warn(
    "Optional dependency '@supabase/supabase-js' is not installed. Supabase client will throw if accessed.",
    error
  );
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const missingDependencyMessage =
  "Supabase client is unavailable. Install '@supabase/supabase-js' to enable this feature.";

export const supabase =
  createClient?.(supabaseUrl, supabaseServiceRoleKey) ??
  new Proxy(
    {},
    {
      get() {
        throw new Error(missingDependencyMessage);
      },
    }
  );
