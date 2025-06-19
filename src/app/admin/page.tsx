'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [jsonData, setJsonData] = useState('');
  const [jsonUrl, setJsonUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'manual' | 'file' | 'url'>('manual');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setJsonData(content);
      };
      reader.readAsText(file);
    }
  };

  const handleUrlFetch = async () => {
    if (!jsonUrl) return;
    
    setIsLoading(true);
    setStatus('Fetching JSON from URL...');
    
    try {
      const response = await fetch(`/api/admin/fetch-json?url=${encodeURIComponent(jsonUrl)}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setJsonData(JSON.stringify(result.data, null, 2));
        setStatus('JSON fetched successfully!');
      } else {
        setStatus(`Error fetching JSON: ${result.error}`);
      }
    } catch (error) {
      setStatus('Error fetching JSON from URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      const parsedData = JSON.parse(jsonData);
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(parsedData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('Upload successful!');
        if (uploadMethod === 'manual') {
          setJsonData('');
        }
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('Error: Invalid JSON format');
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
                onClick={() => setUploadMethod('manual')}
                className={`px-4 py-2 rounded ${uploadMethod === 'manual' ? 'btn-premium' : 'btn-premium-outline'}`}
              >
                Manual Input
              </button>
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
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    onClick={handleUrlFetch}
                    disabled={isLoading || !jsonUrl}
                    className="btn-premium-outline disabled:opacity-50"
                  >
                    Fetch
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
                  className="input-premium w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="jsonData" className="block text-sm font-medium mb-2">
                JSON Data
              </label>
              <textarea
                id="jsonData"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="input-premium w-full h-96 font-mono text-sm"
                placeholder='{"name":"FitGirl","downloads":[...]}'
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
          
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
      "uris": ["magnet:?xt=urn:btih:..."],
      "uploadDate": "2025-06-19T11:53:38.000Z",
      "fileSize": "7.9 GB"
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}