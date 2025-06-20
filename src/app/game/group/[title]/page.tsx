'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Source {
  name: string;
  uris: string[];
  uploadDate: string;
  fileSize: string;
  gameVersion?: string;
  originalTitle?: string;
}

interface GroupedGame {
  _id: string;
  title: string;
  cleanTitle?: string;
  version?: string;
  genres: string[];
  totalLikes: number;
  likedBy: string[];
  sources: Source[];
  createdAt: string;
  updatedAt: string;
  games: any[];
}

interface Comment {
  _id: string;
  user: {
    _id: string;
    username: string;
  };
  content: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

export default function GroupedGamePage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<GroupedGame | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchGame();
    fetchComments();
  }, [params.title]);

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/game/group/${params.title}`);
      if (response.ok) {
        const data = await response.json();
        setGame(data);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching grouped game:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/game/group/${params.title}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // For now, we'll use the first game's ID for likes
    // In a full implementation, you might want to handle likes differently for grouped games
    if (game && game.games.length > 0) {
      try {
        const response = await fetch(`/api/game/${game.games[0]._id}/like`, {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setGame(prev => prev ? { ...prev, totalLikes: data.likes, likedBy: data.likedBy } : null);
        }
      } catch (error) {
        console.error('Error liking game:', error);
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/game/group/${params.title}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTorrentLink = (magnetUris: string[]) => {
    if (magnetUris.length === 1) {
      if (typeof window !== 'undefined') {
        window.open(magnetUris[0], '_self');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 bg-black/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-lg font-medium hover:text-gray-300 mb-4 inline-block">
            ← Back to Torrents
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="card-premium mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {game.cleanTitle || game.title}
            {game.version && (
              <span className="text-xl text-gray-400 ml-3">({game.version})</span>
            )}
          </h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {game.genres.map((genre) => (
              <span key={genre} className="px-3 py-1 bg-gray-700 text-sm rounded">
                {genre}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                user && game.likedBy.includes(user.id)
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              ❤️ {game.totalLikes} Likes
            </button>
            
            <div className="text-gray-400 text-sm">
              Added {formatDate(game.createdAt)}
            </div>
            
            <div className="text-gray-400 text-sm">
              {game.games.length} version{game.games.length !== 1 ? 's' : ''} available
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Download Sources ({game.sources.length})</h3>
            {game.sources.map((source, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="font-medium text-lg mb-2">
                      {source.name}
                      {source.gameVersion && (
                        <span className="text-gray-400 ml-2">({source.gameVersion})</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      Size: {source.fileSize} | Upload: {formatDate(source.uploadDate)}
                    </div>
                    {source.originalTitle && source.originalTitle !== (game.cleanTitle || game.title) && (
                      <div className="text-xs text-gray-500 mt-1">
                        Original: {source.originalTitle}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openTorrentLink(source.uris)}
                    className="btn-premium-outline"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium">
          <h2 className="text-2xl font-semibold mb-6">Comments ({comments.length})</h2>
          
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="input-premium w-full h-24 mb-4"
                placeholder="Write a comment..."
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-800 rounded-lg text-center">
              <p className="mb-4">You need to be logged in to comment</p>
              <Link href="/login" className="btn-premium-outline">
                Sign In
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">{comment.user.username}</div>
                    <div className="text-sm text-gray-400">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                  <p className="text-gray-300">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}