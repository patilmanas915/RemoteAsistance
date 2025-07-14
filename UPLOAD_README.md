# File Upload System

## Overview
The file upload system organizes uploaded files by session code in a structured folder hierarchy.

## Folder Structure
```
public/uploads/
└── <session-code>/
    ├── pdf/
    │   └── <timestamp>_<filename>.pdf
    ├── image/
    │   └── <timestamp>_<filename>.jpg
    └── video/
        └── <timestamp>_<filename>.mp4
```

## API Endpoints

### Upload Files
- **POST** `/api/upload/pdf` - Upload PDF files
- **POST** `/api/upload/image` - Upload image files  
- **POST** `/api/upload/video` - Upload video files

### List Files
- **GET** `/api/uploads/list?sessionCode=<code>` - List all files for a session

## Request Format
All upload endpoints expect `multipart/form-data` with:
- `file`: The file to upload
- `annotationRoomCode`: The session code

## Response Format
```json
{
  "success": true,
  "type": "image",
  "url": "/uploads/ABC12/image/1704067200000_example.jpg",
  "filename": "example.jpg",
  "savedFilename": "1704067200000_example.jpg",
  "size": 1024576,
  "roomCode": "ABC12"
}
```

## Features
- ✅ Session-based folder organization
- ✅ Unique filename generation (timestamp prefix)
- ✅ File type validation
- ✅ Automatic directory creation
- ✅ WebSocket notification for images
- ✅ Error handling and logging
- ✅ File listing API

## Environment Configuration

### Environment Variables
Add these to your `.env.local` file:
```bash
# Public upload base URL for Unity (uses IP address instead of localhost)
NEXT_PUBLIC_UPLOAD_BASE_URL=http://192.168.50.121:3000
```

### URL Configuration for Unity
- **Backend APIs** return relative URLs like `/uploads/ABC12/image/filename.jpg`
- **Frontend** converts these to full URLs using `NEXT_PUBLIC_UPLOAD_BASE_URL` when sending to Unity
- **Unity receives** full URLs like `http://192.168.50.121:3000/uploads/ABC12/image/filename.jpg`

This ensures Unity can access files using the correct IP address instead of localhost.

## File Access
Uploaded files are publicly accessible at:
- **Local Development**: `http://localhost:3000/uploads/<session-code>/<type>/<filename>`
- **Unity (via WebSocket)**: `http://192.168.50.121:3000/uploads/<session-code>/<type>/<filename>`

## Notes
- Files are stored in `public/uploads/` for easy access
- The `uploads/` folder is added to `.gitignore`
- Timestamps prevent filename conflicts
- All uploads require a valid session code
