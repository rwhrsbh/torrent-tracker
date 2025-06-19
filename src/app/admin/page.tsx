'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [jsonUrl, setJsonUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatus('Uploading file...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('adminToken', adminToken);

    try {
      const response = await fetch('/api/admin/upload-file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('File uploaded successfully!');
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('Error: File upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!jsonUrl) return;
    
    setIsLoading(true);
    setStatus('Processing URL...');
    
    try {
      const response = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ url: jsonUrl }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setStatus('URL processed successfully!');
        setJsonUrl('');
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('Error processing URL');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
        
        <div className="card-premium">
          <h2 className="text-xl font-semibold mb-6">Upload Torrent Data</h2>
          
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod('file')}
                className={`px-4 py-2 rounded ${uploadMethod === 'file' ? 'btn-premium' : 'btn-premium-outline'}`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`px-4 py-2 rounded ${uploadMethod === 'url' ? 'btn-premium' : 'btn-premium-outline'}`}
              >
                From URL
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="adminToken" className="block text-sm font-medium mb-2">
                Admin Token
              </label>
              <input
                type="password"
                id="adminToken"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                className="input-premium w-full"
                placeholder="Enter admin token"
                required
              />
            </div>

            {uploadMethod === 'url' && (
              <div>
                <label htmlFor="jsonUrl" className="block text-sm font-medium mb-2">
                  JSON URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    id="jsonUrl"
                    value={jsonUrl}
                    onChange={(e) => setJsonUrl(e.target.value)}
                    className="input-premium flex-1"
                    placeholder="https://hydralinks.cloud/sources/fitgirl.json"
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={isLoading || !jsonUrl || !adminToken}
                    className="btn-premium disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Upload'}
                  </button>
                </div>
              </div>
            )}

            {uploadMethod === 'file' && (
              <div>
                <label htmlFor="jsonFile" className="block text-sm font-medium mb-2">
                  Upload JSON File
                </label>
                <input
                  type="file"
                  id="jsonFile"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={!adminToken}
                  className="input-premium w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600 disabled:opacity-50"
                />
                <p className="text-sm text-gray-400 mt-2">
                  {!adminToken ? 'Enter admin token first' : 'Select a JSON file to upload'}
                </p>
              </div>
            )}
          </div>
          
          {status && (
            <div className={`mt-4 p-4 rounded ${
              status.includes('Error') 
                ? 'bg-red-900 border border-red-700' 
                : 'bg-green-900 border border-green-700'
            }`}>
              {status}
            </div>
          )}
        </div>
        
        <div className="mt-8 card-premium">
          <h3 className="text-lg font-semibold mb-4">JSON Format Example</h3>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-x-auto">
{`{
  "name": "FitGirl",
  "downloads": [
    {
      "title": "Game Title",
      "genres": ["Action", "Adventure", "RPG"],
      "uris": ["magnet:?xt=urn:btih:..."],
      "uploadDate": "2025-06-19T11:53:38.000Z",
      "fileSize": "7.9 GB"
    }
  ]
}`}
          </pre>
          <div className="mt-4 text-sm text-gray-400">
            <p><strong>Примечания:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><code>genres</code> - опциональный массив жанров. Если не указан, будет "Game"</li>
              <li><code>uploadDate</code> - опциональная дата. Если не указана или невалидна, будет текущая дата</li>
              <li><code>fileSize</code> - опциональный размер файла. Если не указан, будет "Unknown"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}