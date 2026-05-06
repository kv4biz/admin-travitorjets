//src/lib/auth/admin-auth.ts
import { createClient } from "@/lib/client";

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignInResult {
  success: boolean;
  error?: string;
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(credentials: SignInCredentials): Promise<SignInResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<SignInResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Send password reset email
 */
export async function resetPasswordForEmail(email: string): Promise<PasswordResetResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Update user password (must be called after clicking reset link)
 */
export async function updatePassword(newPassword: string): Promise<PasswordResetResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
