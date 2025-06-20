'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [jsonUrl, setJsonUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url' | 'auto'>('file');
  const [autoFetchResults, setAutoFetchResults] = useState<any>(null);

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

  const handleAutoFetch = async () => {
    if (!adminToken) return;
    
    setIsLoading(true);
    setStatus('Starting auto-fetch from Hydra Wiki...');
    setAutoFetchResults(null);
    
    try {
      const response = await fetch('/api/admin/auto-fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminToken }),
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setStatus('Auto-fetch completed successfully!');
        setAutoFetchResults(result);
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('Error: Auto-fetch failed');
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
              <button
                type="button"
                onClick={() => setUploadMethod('auto')}
                className={`px-4 py-2 rounded ${uploadMethod === 'auto' ? 'btn-premium' : 'btn-premium-outline'}`}
              >
                Auto-Fetch (Hydra Wiki)
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

            {uploadMethod === 'auto' && (
              <div>
                <div className="bg-gray-800 p-4 rounded mb-4">
                  <h3 className="font-medium mb-2">Auto-Fetch from Hydra Wiki</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    This will automatically fetch all sources from library.hydra.wiki and update your database. 
                    Sources with unchanged game counts will be skipped to save time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFetch}
                  disabled={isLoading || !adminToken}
                  className="btn-premium disabled:opacity-50 w-full"
                >
                  {isLoading ? 'Fetching from Hydra Wiki...' : 'Start Auto-Fetch'}
                </button>
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

          {autoFetchResults && (
            <div className="mt-6 bg-gray-800 p-4 rounded">
              <h3 className="font-medium mb-3">Auto-Fetch Results</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{autoFetchResults.summary.totalSources}</div>
                  <div className="text-sm text-gray-400">Total Sources</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{autoFetchResults.summary.processedSources}</div>
                  <div className="text-sm text-gray-400">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{autoFetchResults.summary.skippedSources}</div>
                  <div className="text-sm text-gray-400">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{autoFetchResults.summary.totalGamesAdded}</div>
                  <div className="text-sm text-gray-400">Games Added</div>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                <h4 className="font-medium mb-2">Source Details:</h4>
                <div className="space-y-2">
                  {autoFetchResults.results.map((result: any, index: number) => (
                    <div key={index} className={`p-2 rounded text-sm ${
                      result.status === 'success' ? 'bg-green-900/30' :
                      result.status === 'skipped' ? 'bg-yellow-900/30' :
                      'bg-red-900/30'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{result.source}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.status === 'success' ? 'bg-green-600' :
                          result.status === 'skipped' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      {result.gamesAdded !== undefined && (
                        <div className="text-gray-400 mt-1">
                          Processed: {result.gamesProcessed}, Added: {result.gamesAdded}
                        </div>
                      )}
                      {result.reason && (
                        <div className="text-gray-400 mt-1">Reason: {result.reason}</div>
                      )}
                      {result.error && (
                        <div className="text-red-400 mt-1">Error: {result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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