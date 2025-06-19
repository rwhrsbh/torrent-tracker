# Premium Torrent Tracker

A modern, premium-styled torrent tracker built with Next.js, featuring a sleek black and white design.

## Features

- Premium black/white UI design
- MongoDB database integration
- Admin panel for JSON uploads
- Search functionality
- Responsive design
- Copy magnet links to clipboard

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/torrent-tracker
ADMIN_TOKEN=your-secure-admin-token
```

3. Start MongoDB locally or use MongoDB Atlas

4. Run the development server:
```bash
npm run dev
```

5. Access the admin panel at `/admin`

## API Endpoints

- `GET /api/torrents` - Fetch all torrents
- `POST /api/admin/upload` - Upload torrent data (requires admin token)

## JSON Format

Upload torrent data in this format:

```json
{
  "name": "FitGirl",
  "downloads": [
    {
      "title": "Game Title",
      "uris": ["magnet:?xt=urn:btih:..."],
      "uploadDate": "2025-06-19T11:53:38.000Z",
      "fileSize": "7.9 GB"
    }
  ]
}
```

## Deployment

Deploy to Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `ADMIN_TOKEN`: Your secure admin token
3. Deploy

## Technologies

- Next.js 15
- TypeScript
- Tailwind CSS
- MongoDB
- Mongoose
