import { supabase } from '../lib/supabase';

export interface GoogleBusiness {
  id?: string;
  google_business_id: string;
  name: string;
  rating?: number | null;
  reviews_count?: number | null;
  address?: string | null;
  domain?: string | null;
  is_verified?: boolean;
  social_links?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    website?: string;
    twitter?: string;
    youtube?: string;
  };
}

export const googleBusinessService = {
  // Get all Google businesses
  getAll: async (): Promise<{ data: GoogleBusiness[] | null; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('google_businesses')
        .select('*')
        .order('name');

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'An error occurred fetching Google businesses' 
      };
    }
  },

  // Get a single Google business by ID
  getById: async (id: string): Promise<{ data: GoogleBusiness | null; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('google_businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'An error occurred fetching Google business' 
      };
    }
  },

  // Create a new Google business
  create: async (business: Omit<GoogleBusiness, 'id'>): Promise<{ data: GoogleBusiness | null; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('google_businesses')
        .insert(business)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'An error occurred creating Google business' 
      };
    }
  },

  // Update a Google business
  update: async (id: string, updates: Partial<GoogleBusiness>): Promise<{ data: GoogleBusiness | null; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('google_businesses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'An error occurred updating Google business' 
      };
    }
  },

  // Delete a Google business
  delete: async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('google_businesses')
        .delete()
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'An error occurred deleting Google business' 
      };
    }
  },

  // Search Google businesses by name
  searchByName: async (searchTerm: string): Promise<{ data: GoogleBusiness[] | null; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('google_businesses')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name');

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'An error occurred searching Google businesses' 
      };
    }
  },

  // Bulk import businesses
  bulkImport: async (businesses: Omit<GoogleBusiness, 'id'>[]): Promise<{ successCount: number; errorCount: number; errors: string[] }> => {
    try {
      const { data, error } = await supabase
        .from('google_businesses')
        .insert(businesses)
        .select();

      if (error) {
        return { successCount: 0, errorCount: businesses.length, errors: [error.message] };
      }

      return { successCount: data?.length || 0, errorCount: 0, errors: [] };
    } catch (error) {
      return { 
        successCount: 0, 
        errorCount: businesses.length, 
        errors: [error instanceof Error ? error.message : 'An error occurred during bulk import'] 
      };
    }
  }
}; 