'use client';

interface Download {
  title: string;
  uris: string[];
  uploadDate: string;
  fileSize: string;
}

interface Torrent {
  _id: string;
  name: string;
  downloads: Download[];
  createdAt: string;
  updatedAt: string;
}

interface TorrentCardProps {
  torrent: Torrent;
}

export default function TorrentCard({ torrent }: TorrentCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const copyMagnetLink = (magnetLink: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(magnetLink);
    }
  };

  return (
    <div className="card-premium">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{torrent.name}</h2>
        <span className="text-sm text-gray-400">
          {torrent.downloads.length} releases
        </span>
      </div>
      
      <div className="space-y-4">
        {torrent.downloads.map((download, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-lg mb-2">{download.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span>Size: {download.fileSize}</span>
                  <span>Upload: {formatDate(download.uploadDate)}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {download.uris.map((uri, uriIndex) => (
                  <button
                    key={uriIndex}
                    onClick={() => copyMagnetLink(uri)}
                    className="btn-premium-outline text-sm"
                    title="Copy magnet link"
                  >
                    Copy Magnet {download.uris.length > 1 ? `#${uriIndex + 1}` : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}