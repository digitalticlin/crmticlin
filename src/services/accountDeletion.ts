import { supabase } from '../lib/supabase';

/**
 * Delete a user account completely
 * This will remove all data associated with the user
 */
export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Option 1: Call the batch RPC function (recommended for users with lots of data)
    const { data, error } = await supabase.rpc('rpc_delete_user_account_batch', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error calling rpc_delete_user_account_batch:', error);

      // Fallback to Option 2: Call the edge function directly
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('delete_account', {
        body: { userId }
      });

      if (edgeError) {
        console.error('Error calling delete_account edge function:', edgeError);
        return { success: false, error: edgeError.message };
      }

      return edgeData || { success: true };
    }

    return data || { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete a user account using the simple CASCADE method (for users with little data)
 */
export async function deleteUserAccountSimple(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('rpc_delete_user_account', {
      p_user_id: userId
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data || { success: true };
  } catch (error) {
    console.error('Error deleting user account (simple):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete current user's own account
 */
export async function deleteMyAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    return deleteUserAccount(user.id);
  } catch (error) {
    console.error('Error deleting current user account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete a user account asynchronously (for users with LOTS of data)
 */
export async function deleteUserAccountAsync(userId: string): Promise<{ success: boolean; error?: string; queueId?: string }> {
  try {
    const { data, error } = await supabase.rpc('rpc_delete_user_account_async', {
      p_user_id: userId
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      error: data.error,
      queueId: data.queue_id
    };
  } catch (error) {
    console.error('Error deleting user account (async):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check the status of an asynchronous deletion
 */
export async function checkDeletionStatus(userId: string): Promise<{ status: string; progress?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('check_deletion_status', {
      p_user_id: userId
    });

    if (error) {
      return { status: 'error', error: error.message };
    }

    return {
      status: data.status,
      progress: data.progress,
      error: data.error_message
    };
  } catch (error) {
    console.error('Error checking deletion status:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Admin function to delete any user account
 * Only admins can use this function
 */
export async function adminDeleteUserAccount(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify current user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' };
    }

    // For admin deletions, use async by default (safer for large accounts)
    return deleteUserAccountAsync(targetUserId);
  } catch (error) {
    console.error('Error in admin delete user account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}