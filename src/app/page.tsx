'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import BeeSwarm from '@/components/BeeSwarm';
import HoneycombBackground from '@/components/HoneycombBackground';
import BeeCursor from '@/components/BeeCursor';
import BeehiveBackground from '@/components/BeehiveBackground';

const AdBlockDetector = dynamic(() => import('@/components/AdBlockDetector'), {
  ssr: false
});

const DevToolsDetector = dynamic(() => import('@/components/DevToolsDetector'), {
  ssr: false
});

interface Source {
  name: string;
  uris: string[];
  uploadDate: string;
  fileSize: string;
}

interface GameTorrent {
  _id: string;
  title: string;
  cleanTitle?: string;
  version?: string;
  genres: string[];
  likes: number;
  likedBy: string[];
  sources: Source[];
  createdAt: string;
  updatedAt: string;
}

interface SourceOption {
  name: string;
  count: number;
}

interface GenreOption {
  name: string;
  count: number;
}

interface SearchSuggestion {
  _id: string;
  title: string;
  cleanTitle?: string;
  version?: string;
  genres: string[];
}

interface PaginationInfo {
  current: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  totalItems: number;
}

export default function Home() {
  const [games, setGames] = useState<GameTorrent[]>([]);
  const [availableSources, setAvailableSources] = useState<SourceOption[]>([]);
  const [availableGenres, setAvailableGenres] = useState<GenreOption[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [pendingMagnetLinks, setPendingMagnetLinks] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchGames();
    fetchSources();
    fetchGenres();
    
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchGames();
  }, [selectedSources, selectedGenres]);

  useEffect(() => {
    fetchGames();
  }, [currentPage]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchSearchSuggestions();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const fetchGames = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSources.length > 0) params.set('sources', selectedSources.join(','));
      if (selectedGenres.length > 0) params.set('genres', selectedGenres.join(','));
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      const response = await fetch(`/api/torrents?${params}`);
      const data = await response.json();
      setGames(data.games);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/sources');
      const data = await response.json();
      setAvailableSources(data);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres');
      const data = await response.json();
      setAvailableGenres(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchSearchSuggestions = async () => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setSearchSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
    }
  };

  const handleSuggestionClick = (game: SearchSuggestion) => {
    setShowSuggestions(false);
    setSearchTerm('');
    const gameTitle = encodeURIComponent(game.cleanTitle || game.title);
    window.location.href = `/game/group/${gameTitle}`;
  };

  const toggleSource = (sourceName: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceName) 
        ? prev.filter(s => s !== sourceName)
        : [...prev, sourceName]
    );
  };

  const toggleGenre = (genreName: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreName) 
        ? prev.filter(g => g !== genreName)
        : [...prev, genreName]
    );
  };

  const isMagnetLink = (uri: string) => {
    return uri.startsWith('magnet:');
  };

  const openTorrentLink = (magnetUris: string[]) => {
    if (magnetUris.length === 1) {
      if (typeof window !== 'undefined') {
        if (isMagnetLink(magnetUris[0])) {
          // Магнет ссылка - открываем в том же окне
          window.open(magnetUris[0], '_self');
        } else {
          // Обычная ссылка - открываем в новой вкладке
          window.open(magnetUris[0], '_blank', 'noopener,noreferrer');
        }
      }
    } else {
      setPendingMagnetLinks(magnetUris);
      setShowSourceModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    window.location.reload();
  };

  const displayedGames = games;


  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading torrents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <BeehiveBackground />
      <HoneycombBackground />
      <BeeSwarm />
      <BeeCursor />
      <AdBlockDetector />
      <DevToolsDetector />
      <header className="border-b border-gray-800 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              🍯 HiveShare - Premium Bee Tracker 🐝
            </h1>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Welcome, {user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="btn-premium-outline text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="btn-premium-outline text-sm">
                    Login
                  </Link>
                  <Link href="/register" className="btn-premium text-sm">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="input-premium w-full"
              />
              
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-b-lg max-h-60 overflow-y-auto z-20">
                  {searchSuggestions.map((suggestion) => (
                    <div
                      key={suggestion._id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium">
                        {suggestion.cleanTitle || suggestion.title}
                        {suggestion.version && (
                          <span className="text-gray-400 ml-2">({suggestion.version})</span>
                        )}
                      </div>
                      {suggestion.genres.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {suggestion.genres.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sources</label>
              <div className="flex flex-wrap gap-2">
                {availableSources.map((source) => (
                  <button
                    key={source.name}
                    onClick={() => toggleSource(source.name)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedSources.includes(source.name)
                        ? 'bg-white text-black'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {source.name} ({source.count})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Genres</label>
                {availableGenres.length > 10 && (
                  <button
                    onClick={() => setShowAllGenres(!showAllGenres)}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    {showAllGenres ? 'Show Less' : `Show All (${availableGenres.length})`}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(showAllGenres ? availableGenres : availableGenres.slice(0, 10)).map((genre) => (
                  <button
                    key={genre.name}
                    onClick={() => toggleGenre(genre.name)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedGenres.includes(genre.name)
                        ? 'bg-white text-black'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {genre.name} ({genre.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {displayedGames.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-400">No games found</div>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {displayedGames.map((game) => (
                <div key={game._id} className="card-premium">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <Link href={`/game/group/${encodeURIComponent(game.cleanTitle || game.title)}`} className="hover:text-gray-300">
                        <h2 className="text-2xl font-semibold mb-2">
                          {game.cleanTitle || game.title}
                          {game.version && (
                            <span className="text-lg text-gray-400 ml-2">({game.version})</span>
                          )}
                        </h2>
                      </Link>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {game.genres.map((genre) => (
                          <span key={genre} className="genre-tag">
                            {genre}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex flex-wrap gap-2">
                          {game.sources.map((source) => (
                            <span key={source.name} className="px-3 py-1 bg-gradient-to-r from-amber-600 to-yellow-600 text-black text-xs rounded-full font-semibold">
                              📦 {source.name}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-yellow-400 like-button">
                          <span>🍯 {game.likes} Sweet!</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Link 
                        href={`/game/group/${encodeURIComponent(game.cleanTitle || game.title)}`}
                        className="btn-premium-outline text-sm text-center"
                      >
                        View Details
                      </Link>
                      {game.sources.map((source) => (
                        <button
                          key={source.name}
                          onClick={() => openTorrentLink(source.uris)}
                          className="btn-premium-outline text-sm"
                          title={`Download from ${source.name} - ${source.fileSize}`}
                        >
                          🐝 Buzz & Download ({source.name})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.total > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPrev}
                  className="btn-premium-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-gray-400">
                  Page {pagination.current} of {pagination.total}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!pagination.hasNext}
                  className="btn-premium-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showSourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Select Download Source</h3>
            <div className="space-y-2">
              {pendingMagnetLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      if (isMagnetLink(link)) {
                        // Магнет ссылка - открываем в том же окне
                        window.open(link, '_self');
                      } else {
                        // Обычная ссылка - открываем в новой вкладке
                        window.open(link, '_blank', 'noopener,noreferrer');
                      }
                    }
                    setShowSourceModal(false);
                  }}
                  className="btn-premium-outline w-full text-left"
                >
                  Source {index + 1} {!isMagnetLink(link) && '(Link)'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSourceModal(false)}
              className="btn-premium w-full mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-gray-800 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>Premium Torrent Tracker - Elite Downloads</p>
        </div>
      </footer>
    </div>
  );
}
