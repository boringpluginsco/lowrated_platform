import React, { useState, useRef } from 'react';
import { googleBusinessService, type GoogleBusiness } from '../services/googleBusinessService';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DataRow {
  [key: string]: any;
}

interface FieldMapping {
  name: string;
  rating: string;
  reviews_count: string;
  address: string;
  domain: string;
  google_business_id: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  website: string;
  is_verified: string;
  phone: string;
  description: string;
  category: string;
  type: string;
  full_address: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  business_status: string;
  about: string;
  prices: string;
  working_hours: string;
  email_1: string;
  email_2: string;
  email_3: string;
  phone_1: string;
  phone_2: string;
  phone_3: string;
  twitter: string;
  youtube: string;
  website_title: string;
  website_description: string;
  name_for_emails: string;
}

const DEFAULT_FIELD_MAPPING: FieldMapping = {
  name: 'name',
  rating: 'rating',
  reviews_count: 'reviews',
  address: 'full_address',
  domain: 'site',
  google_business_id: 'google_id',
  instagram: 'instagram',
  linkedin: 'linkedin',
  facebook: 'facebook',
  website: 'site',
  is_verified: 'verified',
  phone: 'phone',
  description: 'description',
  category: 'category',
  type: 'type',
  full_address: 'full_address',
  city: 'city',
  state: 'state',
  country: 'country',
  latitude: 'latitude',
  longitude: 'longitude',
  business_status: 'business_status',
  about: 'about',
  prices: 'prices',
  working_hours: 'working_hours',
  email_1: 'email_1',
  email_2: 'email_2',
  email_3: 'email_3',
  phone_1: 'phone_1',
  phone_2: 'phone_2',
  phone_3: 'phone_3',
  twitter: 'twitter',
  youtube: 'youtube',
  website_title: 'website_title',
  website_description: 'website_description',
  name_for_emails: 'name_for_emails'
};

export default function DataImportModal({ isOpen, onClose, onSuccess }: DataImportModalProps) {
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>(DEFAULT_FIELD_MAPPING);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<DataRow[]>([]);
  const [fileType, setFileType] = useState<'csv' | 'json' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isJson = fileName.endsWith('.json');

    if (!isCsv && !isJson) {
      setError('Please select a CSV or JSON file');
      return;
    }

    setFileType(isCsv ? 'csv' : 'json');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (isCsv) {
        parseCsv(content);
      } else {
        parseJson(content);
      }
    };
    reader.readAsText(file);
  };

  const parseCsv = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        setError('CSV file is empty');
        return;
      }

      // Parse headers
      const headerLine = lines[0];
      const csvHeaders = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
      setHeaders(csvHeaders);

      // Parse data rows
      const dataRows: DataRow[] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) { // Preview first 5 rows
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: DataRow = {};
        csvHeaders.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        dataRows.push(row);
      }
      setPreviewData(dataRows);

      // Parse all data rows
      const allDataRows: DataRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: DataRow = {};
        csvHeaders.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        allDataRows.push(row);
      }
      setData(allDataRows);

      // Auto-map fields based on common header names
      const autoMapping: Partial<FieldMapping> = {};
      csvHeaders.forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        // Basic business info
        if (lowerHeader === 'name' || lowerHeader.includes('company_insights.name')) {
          autoMapping.name = header;
        } else if (lowerHeader === 'name_for_emails') {
          autoMapping.name_for_emails = header;
        } else if (lowerHeader === 'rating') {
          autoMapping.rating = header;
        } else if (lowerHeader === 'reviews') {
          autoMapping.reviews_count = header;
        } else if (lowerHeader === 'full_address') {
          autoMapping.address = header;
        } else if (lowerHeader === 'site') {
          autoMapping.domain = header;
        } else if (lowerHeader === 'google_id') {
          autoMapping.google_business_id = header;
        } else if (lowerHeader === 'verified') {
          autoMapping.is_verified = header;
        }
        
        // Social media
        else if (lowerHeader === 'instagram') {
          autoMapping.instagram = header;
        } else if (lowerHeader === 'linkedin') {
          autoMapping.linkedin = header;
        } else if (lowerHeader === 'facebook') {
          autoMapping.facebook = header;
        } else if (lowerHeader === 'twitter') {
          autoMapping.twitter = header;
        } else if (lowerHeader === 'youtube') {
          autoMapping.youtube = header;
        }
        
        // Contact info
        else if (lowerHeader === 'phone') {
          autoMapping.phone = header;
        } else if (lowerHeader === 'email_1') {
          autoMapping.email_1 = header;
        } else if (lowerHeader === 'email_2') {
          autoMapping.email_2 = header;
        } else if (lowerHeader === 'email_3') {
          autoMapping.email_3 = header;
        } else if (lowerHeader === 'phone_1') {
          autoMapping.phone_1 = header;
        } else if (lowerHeader === 'phone_2') {
          autoMapping.phone_2 = header;
        } else if (lowerHeader === 'phone_3') {
          autoMapping.phone_3 = header;
        }
        
        // Location info
        else if (lowerHeader === 'city') {
          autoMapping.city = header;
        } else if (lowerHeader === 'state') {
          autoMapping.state = header;
        } else if (lowerHeader === 'country') {
          autoMapping.country = header;
        } else if (lowerHeader === 'latitude') {
          autoMapping.latitude = header;
        } else if (lowerHeader === 'longitude') {
          autoMapping.longitude = header;
        }
        
        // Business details
        else if (lowerHeader === 'description') {
          autoMapping.description = header;
        } else if (lowerHeader === 'category') {
          autoMapping.category = header;
        } else if (lowerHeader === 'type') {
          autoMapping.type = header;
        } else if (lowerHeader === 'business_status') {
          autoMapping.business_status = header;
        } else if (lowerHeader === 'about') {
          autoMapping.about = header;
        } else if (lowerHeader === 'prices') {
          autoMapping.prices = header;
        } else if (lowerHeader === 'working_hours') {
          autoMapping.working_hours = header;
        }
        
        // Website info
        else if (lowerHeader === 'website_title') {
          autoMapping.website_title = header;
        } else if (lowerHeader === 'website_description') {
          autoMapping.website_description = header;
        }
      });

      setFieldMapping({ ...DEFAULT_FIELD_MAPPING, ...autoMapping });
      setError('');
    } catch (err) {
      setError('Error parsing CSV file. Please check the format.');
    }
  };

  const parseJson = (jsonText: string) => {
    try {
      const jsonData = JSON.parse(jsonText);
      
      // Handle different JSON formats
      let dataArray: DataRow[] = [];
      
      if (Array.isArray(jsonData)) {
        // Direct array of objects
        dataArray = jsonData;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        // Wrapped in data property
        dataArray = jsonData.data;
      } else if (jsonData.businesses && Array.isArray(jsonData.businesses)) {
        // Wrapped in businesses property
        dataArray = jsonData.businesses;
      } else if (jsonData.results && Array.isArray(jsonData.results)) {
        // Wrapped in results property
        dataArray = jsonData.results;
      } else {
        // Single object - wrap in array
        dataArray = [jsonData];
      }

      if (dataArray.length === 0) {
        setError('JSON file contains no data');
        return;
      }

      // Extract headers from first object
      const firstRow = dataArray[0];
      const jsonHeaders = Object.keys(firstRow);
      setHeaders(jsonHeaders);

      // Set preview data (first 5 rows)
      const previewRows = dataArray.slice(0, 5);
      setPreviewData(previewRows);

      // Set all data
      setData(dataArray);

      // Auto-map fields based on common header names
      const autoMapping: Partial<FieldMapping> = {};
      jsonHeaders.forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        // Basic business info
        if (lowerHeader === 'name' || lowerHeader.includes('company_insights.name')) {
          autoMapping.name = header;
        } else if (lowerHeader === 'name_for_emails') {
          autoMapping.name_for_emails = header;
        } else if (lowerHeader === 'rating') {
          autoMapping.rating = header;
        } else if (lowerHeader === 'reviews') {
          autoMapping.reviews_count = header;
        } else if (lowerHeader === 'full_address') {
          autoMapping.address = header;
        } else if (lowerHeader === 'site') {
          autoMapping.domain = header;
        } else if (lowerHeader === 'google_id') {
          autoMapping.google_business_id = header;
        } else if (lowerHeader === 'verified') {
          autoMapping.is_verified = header;
        }
        
        // Social media
        else if (lowerHeader === 'instagram') {
          autoMapping.instagram = header;
        } else if (lowerHeader === 'linkedin') {
          autoMapping.linkedin = header;
        } else if (lowerHeader === 'facebook') {
          autoMapping.facebook = header;
        } else if (lowerHeader === 'twitter') {
          autoMapping.twitter = header;
        } else if (lowerHeader === 'youtube') {
          autoMapping.youtube = header;
        }
        
        // Contact info
        else if (lowerHeader === 'phone') {
          autoMapping.phone = header;
        } else if (lowerHeader === 'email_1') {
          autoMapping.email_1 = header;
        } else if (lowerHeader === 'email_2') {
          autoMapping.email_2 = header;
        } else if (lowerHeader === 'email_3') {
          autoMapping.email_3 = header;
        } else if (lowerHeader === 'phone_1') {
          autoMapping.phone_1 = header;
        } else if (lowerHeader === 'phone_2') {
          autoMapping.phone_2 = header;
        } else if (lowerHeader === 'phone_3') {
          autoMapping.phone_3 = header;
        }
        
        // Location info
        else if (lowerHeader === 'city') {
          autoMapping.city = header;
        } else if (lowerHeader === 'state') {
          autoMapping.state = header;
        } else if (lowerHeader === 'country') {
          autoMapping.country = header;
        } else if (lowerHeader === 'latitude') {
          autoMapping.latitude = header;
        } else if (lowerHeader === 'longitude') {
          autoMapping.longitude = header;
        }
        
        // Business details
        else if (lowerHeader === 'description') {
          autoMapping.description = header;
        } else if (lowerHeader === 'category') {
          autoMapping.category = header;
        } else if (lowerHeader === 'type') {
          autoMapping.type = header;
        } else if (lowerHeader === 'business_status') {
          autoMapping.business_status = header;
        } else if (lowerHeader === 'about') {
          autoMapping.about = header;
        } else if (lowerHeader === 'prices') {
          autoMapping.prices = header;
        } else if (lowerHeader === 'working_hours') {
          autoMapping.working_hours = header;
        }
        
        // Website info
        else if (lowerHeader === 'website_title') {
          autoMapping.website_title = header;
        } else if (lowerHeader === 'website_description') {
          autoMapping.website_description = header;
        }
      });

      setFieldMapping({ ...DEFAULT_FIELD_MAPPING, ...autoMapping });
      setError('');
    } catch (err) {
      setError('Error parsing JSON file. Please check the format.');
    }
  };

  const handleFieldMappingChange = (field: keyof FieldMapping, value: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImport = async () => {
    if (data.length === 0) {
      setError('No data to import');
      return;
    }

    setIsImporting(true);
    setError('');

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
          // Map data to business object
          const getValue = (field: string, fallback?: string) => {
            const value = row[fieldMapping[field as keyof FieldMapping]] || row[field] || fallback || null;
            return value;
          };

          const getNumericValue = (field: string, fallback?: string) => {
            const value = getValue(field, fallback);
            if (value === null || value === undefined || value === '') return null;
            const num = typeof value === 'number' ? value : parseFloat(value);
            return isNaN(num) ? null : num;
          };

          const getBooleanValue = (field: string) => {
            const value = getValue(field);
            if (value === null || value === undefined) return false;
            if (typeof value === 'boolean') return value;
            const str = String(value).toLowerCase();
            return str === 'true' || str === 'yes' || str === '1';
          };

          const businessData: any = {
            name: getValue('name') || getValue('name_for_emails') || '',
            google_business_id: getValue('google_business_id') || `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            rating: getNumericValue('rating'),
            reviews_count: getNumericValue('reviews_count'),
            address: getValue('address') || getValue('full_address'),
            domain: getValue('domain') || getValue('site'),
            is_verified: getBooleanValue('is_verified'),
            social_links: {
              instagram: getValue('instagram'),
              linkedin: getValue('linkedin'),
              facebook: getValue('facebook'),
              website: getValue('website') || getValue('site'),
              twitter: getValue('twitter'),
              youtube: getValue('youtube')
            },
            // Additional fields
            phone: getValue('phone'),
            description: getValue('description'),
            category: getValue('category'),
            business_type: getValue('type'),
            full_address: getValue('full_address'),
            city: getValue('city'),
            state: getValue('state'),
            country: getValue('country'),
            latitude: getNumericValue('latitude'),
            longitude: getNumericValue('longitude'),
            business_status: getValue('business_status'),
            about: getValue('about'),
            prices: getValue('prices'),
            working_hours: getValue('working_hours'),
            email_1: getValue('email_1'),
            email_2: getValue('email_2'),
            email_3: getValue('email_3'),
            phone_1: getValue('phone_1'),
            phone_2: getValue('phone_2'),
            phone_3: getValue('phone_3'),
            website_title: getValue('website_title'),
            website_description: getValue('website_description')
          };

          // Validate required fields
          if (!businessData.name) {
            errorCount++;
            continue;
          }

          const { error } = await googleBusinessService.create(businessData);
          if (error) {
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        onSuccess();
        onClose();
        alert(`Import completed! ${successCount} businesses imported successfully.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`);
      } else {
        setError(`Import failed. ${errorCount} businesses could not be imported.`);
      }
    } catch (err) {
      setError('An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setData([]);
    setHeaders([]);
    setFieldMapping(DEFAULT_FIELD_MAPPING);
    setError('');
    setPreviewData([]);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-gray-600 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">Import Businesses from CSV/JSON</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-md p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b border-gray-600 pb-2">
              Upload File
            </h3>
            
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/80 transition-colors"
              >
                Choose CSV or JSON File
              </button>
              <p className="text-text-secondary text-sm mt-2">
                Supported formats: CSV with headers or JSON array/object
              </p>
              {fileType && (
                <p className="text-accent text-sm mt-1">
                  File type detected: {fileType.toUpperCase()}
                </p>
              )}
            </div>
          </div>

          {/* Field Mapping */}
          {headers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-gray-600 pb-2">
                Map {fileType?.toUpperCase()} Fields to Database Fields
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Business Name *
                  </label>
                  <select
                    value={fieldMapping.name}
                    onChange={(e) => handleFieldMappingChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select field</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Rating
                  </label>
                  <select
                    value={fieldMapping.rating}
                    onChange={(e) => handleFieldMappingChange('rating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select field</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Reviews Count
                  </label>
                  <select
                    value={fieldMapping.reviews_count}
                    onChange={(e) => handleFieldMappingChange('reviews_count', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select field</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Address
                  </label>
                  <select
                    value={fieldMapping.address}
                    onChange={(e) => handleFieldMappingChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select field</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Domain
                  </label>
                  <select
                    value={fieldMapping.domain}
                    onChange={(e) => handleFieldMappingChange('domain', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select field</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Instagram
                  </label>
                  <select
                    value={fieldMapping.instagram}
                    onChange={(e) => handleFieldMappingChange('instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select field</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    LinkedIn
                  </label>
                  <select
                    value={fieldMapping.linkedin}
                    onChange={(e) => handleFieldMappingChange('linkedin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select field</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Facebook
                  </label>
                  <select
                    value={fieldMapping.facebook}
                    onChange={(e) => handleFieldMappingChange('facebook', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#181B26] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select field</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview */}
          {previewData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-gray-600 pb-2">
                Data Preview (First 5 {fileType === 'json' ? 'objects' : 'rows'})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-[#181B26]">
                    <tr>
                      {headers.map(header => (
                        <th key={header} className="px-3 py-2 text-left border border-gray-600 text-text-primary">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b border-gray-600">
                        {headers.map(header => (
                          <td key={header} className="px-3 py-2 text-text-secondary">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <p className="text-text-secondary text-sm">
                Total {fileType === 'json' ? 'objects' : 'rows'} to import: {data.length}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-text-primary border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-primary border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || data.length === 0 || !fieldMapping.name}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : `Import ${data.length} Businesses`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 