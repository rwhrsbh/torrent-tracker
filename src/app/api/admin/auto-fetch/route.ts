import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';
import Source from '@/models/Source';
import { detectGenresWithAI } from '@/lib/genreDetector';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { adminToken } = await request.json();

    // Verify admin token
    if (!adminToken) {
      return NextResponse.json({ error: 'Admin token required' }, { status: 401 });
    }

    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    console.log('Starting auto-fetch from Hydra Wiki...');

    // Fetch resources from Hydra Wiki
    const resourcesResponse = await fetch('https://library.hydra.wiki/data/resources.json');
    if (!resourcesResponse.ok) {
      throw new Error(`Failed to fetch resources: ${resourcesResponse.status}`);
    }

    const resourcesData = await resourcesResponse.json();
    const sources = resourcesData.sources;

    console.log(`Found ${sources.length} sources to process`);

    let processedSources = 0;
    let skippedSources = 0;
    let totalGamesAdded = 0;
    const results = [];

    for (const sourceInfo of sources) {
      try {
        console.log(`Processing source: ${sourceInfo.title}`);

        // Check if we already have this source and if game count changed
        const existingSource = await Source.findOne({ title: sourceInfo.title });
        const currentGameCount = parseInt(sourceInfo.gamesCount);

        if (existingSource && existingSource.lastGameCount === currentGameCount) {
          console.log(`Skipping ${sourceInfo.title} - no new games (${currentGameCount})`);
          skippedSources++;
          results.push({
            source: sourceInfo.title,
            status: 'skipped',
            reason: 'No new games',
            gameCount: currentGameCount
          });
          continue;
        }

        // Fetch games from this source
        console.log(`Fetching games from: ${sourceInfo.url}`);
        const gamesResponse = await fetch(sourceInfo.url);
        if (!gamesResponse.ok) {
          console.error(`Failed to fetch ${sourceInfo.title}: ${gamesResponse.status}`);
          results.push({
            source: sourceInfo.title,
            status: 'error',
            error: `HTTP ${gamesResponse.status}`
          });
          continue;
        }

        const gamesData = await gamesResponse.json();
        console.log(`Response structure for ${sourceInfo.title}:`, {
          isArray: Array.isArray(gamesData),
          hasGames: !!gamesData.games,
          hasDownloads: !!gamesData.downloads,
          hasName: !!gamesData.name,
          keys: Object.keys(gamesData || {})
        });
        
        // Handle both direct array and object with games/downloads property
        let games = [];
        if (Array.isArray(gamesData)) {
          games = gamesData;
        } else if (gamesData.games) {
          games = gamesData.games;
        } else if (gamesData.downloads) {
          games = gamesData.downloads;
        } else {
          console.log(`Unknown data structure in ${sourceInfo.title}`);
          results.push({
            source: sourceInfo.title,
            status: 'error',
            error: 'Unknown data structure'
          });
          continue;
        }

        if (!games.length) {
          console.log(`No games found in ${sourceInfo.title}`);
          results.push({
            source: sourceInfo.title,
            status: 'no_games',
            gameCount: 0
          });
          continue;
        }

        console.log(`Processing ${games.length} games from ${sourceInfo.title}`);

        // Get source name from the fetched data (like "FitGirl", "DODI", etc.)
        const sourceName = gamesData.name || sourceInfo.title;
        console.log(`Using source name: ${sourceName}`);

        // Process games in chunks
        const chunkSize = 200;
        let gamesAdded = 0;

        for (let i = 0; i < games.length; i += chunkSize) {
          const chunk = games.slice(i, i + chunkSize);
          console.log(`Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(games.length / chunkSize)}`);

          // Log structure of first game in chunk for debugging
          if (chunk.length > 0) {
            console.log(`Sample game structure:`, {
              keys: Object.keys(chunk[0] || {}),
              firstGame: chunk[0]
            });
          }

          try {
            // Get all titles from this chunk for AI processing
            const gameTitles = chunk.map(game => game.title).filter(Boolean);
            console.log(`Processing ${gameTitles.length} titles for AI genres...`);
            
            // Get AI genres for the chunk
            const aiGenres = await detectGenresWithAI(gameTitles);

            for (const gameData of chunk) {
              try {
                // Validate and normalize game data
                if (!gameData.title) {
                  console.warn(`Skipping game with missing title:`, gameData);
                  continue;
                }

                // Get AI processed data or use defaults
                const aiData = aiGenres[gameData.title] || { genres: ['Game'] };

                // Check if game already exists
                const existingGame = await GameTorrent.findOne({ title: gameData.title });

                const sourceData = {
                  name: sourceName,
                  uris: gameData.uris || [],
                  uploadDate: gameData.uploadDate ? new Date(gameData.uploadDate) : new Date(),
                  fileSize: gameData.fileSize || 'Unknown'
                };

                if (existingGame) {
                  // Update existing game with new source
                  const existingSourceIndex = existingGame.sources.findIndex(s => s.name === sourceName);
                  if (existingSourceIndex >= 0) {
                    existingGame.sources[existingSourceIndex] = sourceData;
                  } else {
                    existingGame.sources.push(sourceData);
                    gamesAdded++;
                  }
                  existingGame.updatedAt = new Date();
                  await existingGame.save();
                } else {
                  // Create new game
                  const newGame = new GameTorrent({
                    title: gameData.title,
                    cleanTitle: aiData.cleanTitle,
                    version: aiData.version,
                    genres: aiData.genres || ['Game'],
                    sources: [sourceData],
                    likes: 0,
                    likedBy: [],
                    comments: []
                  });
                  await newGame.save();
                  gamesAdded++;
                }
              } catch (gameError) {
                console.error(`Error processing game ${gameData.title}:`, gameError);
              }
            }
          } catch (chunkError) {
            console.error(`Error processing chunk:`, chunkError);
          }

          // Small delay between chunks to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Update or create source record
        if (existingSource) {
          existingSource.description = sourceInfo.description || 'Auto-fetched source';
          existingSource.url = sourceInfo.url;
          existingSource.gamesCount = sourceInfo.gamesCount;
          existingSource.status = sourceInfo.status || ['Unknown'];
          existingSource.addedDate = sourceInfo.addedDate;
          existingSource.lastFetched = new Date();
          existingSource.lastGameCount = currentGameCount;
          await existingSource.save();
        } else {
          const newSource = new Source({
            title: sourceInfo.title,
            description: sourceInfo.description || 'Auto-fetched source',
            url: sourceInfo.url,
            gamesCount: sourceInfo.gamesCount,
            status: sourceInfo.status || ['Unknown'],
            addedDate: sourceInfo.addedDate,
            lastFetched: new Date(),
            lastGameCount: currentGameCount
          });
          await newSource.save();
        }

        processedSources++;
        totalGamesAdded += gamesAdded;

        results.push({
          source: sourceInfo.title,
          status: 'success',
          gamesProcessed: games.length,
          gamesAdded: gamesAdded
        });

        console.log(`Completed ${sourceInfo.title}: ${gamesAdded} games added`);

      } catch (sourceError) {
        console.error(`Error processing source ${sourceInfo.title}:`, sourceError);
        results.push({
          source: sourceInfo.title,
          status: 'error',
          error: sourceError.message
        });
      }
    }

    console.log(`Auto-fetch completed: ${processedSources} processed, ${skippedSources} skipped, ${totalGamesAdded} total games added`);

    return NextResponse.json({
      success: true,
      summary: {
        totalSources: sources.length,
        processedSources,
        skippedSources,
        totalGamesAdded
      },
      results
    });

  } catch (error) {
    console.error('Auto-fetch error:', error);
    return NextResponse.json({ 
      error: 'Auto-fetch failed', 
      details: error.message 
    }, { status: 500 });
  }
}