import React, { useState } from 'react';
import { googleBusinessService, type GoogleBusiness } from '../services/googleBusinessService';

interface AddGoogleBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddGoogleBusinessModal({ isOpen, onClose, onSuccess }: AddGoogleBusinessModalProps) {
  const [formData, setFormData] = useState<Omit<GoogleBusiness, 'id'>>({
    google_business_id: '',
    name: '',
    rating: null,
    reviews_count: null,
    address: '',
    domain: '',
    is_verified: false,
    social_links: {
      instagram: '',
      linkedin: '',
      facebook: '',
      website: ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Generate a unique google_business_id if not provided
      const businessData = {
        ...formData,
        google_business_id: formData.google_business_id || `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const { data, error } = await googleBusinessService.create(businessData);

      if (error) {
        setError(error);
        return;
      }

      if (data) {
        // Reset form
        setFormData({
          google_business_id: '',
          name: '',
          rating: null,
          reviews_count: null,
          address: '',
          domain: '',
          is_verified: false,
          social_links: {
            instagram: '',
            linkedin: '',
            facebook: '',
            website: ''
          }
        });
        
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('An error occurred while creating the business');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '') as keyof typeof formData.social_links;
      setFormData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [socialKey]: value
        }
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : parseFloat(value)
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-gray-600 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">Add New Google Business</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-md p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b border-gray-600 pb-2">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="Enter business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Google Business ID
                </label>
                <input
                  type="text"
                  name="google_business_id"
                  value={formData.google_business_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Rating
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating || ''}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="0.0 - 5.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Reviews Count
                </label>
                <input
                  type="number"
                  name="reviews_count"
                  value={formData.reviews_count || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="Number of reviews"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="Business address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Website Domain
                </label>
                <input
                  type="url"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b border-gray-600 pb-2">
              Social Media Links
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  name="social_instagram"
                  value={formData.social_links?.instagram || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="https://instagram.com/..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="social_linkedin"
                  value={formData.social_links?.linkedin || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="https://linkedin.com/..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  name="social_facebook"
                  value={formData.social_links?.facebook || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="https://facebook.com/..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="social_website"
                  value={formData.social_links?.website || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="flex items-center space-x-3 p-4 bg-[#181B26] rounded-md border border-gray-600">
            <input
              type="checkbox"
              name="is_verified"
              checked={formData.is_verified}
              onChange={handleInputChange}
              className="w-4 h-4 text-accent bg-[#181B26] border-gray-600 rounded focus:ring-accent focus:ring-2"
            />
            <label className="text-sm text-text-primary">
              Verified Business
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-primary border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 