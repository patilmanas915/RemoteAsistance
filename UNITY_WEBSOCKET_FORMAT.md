# Unity WebSocket Message Format

## File Upload Messages to Unity

When files are uploaded through the annotation controller, the system sends WebSocket messages to Unity in a specific format.

### PDF Upload Message
```json
{
  "type": "file",
  "fileType": "pdf",
  "url": "http://192.168.50.121:3000/uploads/ABC12/pdf/1704067200000_document.pdf",
  "urls": ["http://192.168.50.121:3000/uploads/ABC12/pdf/1704067200000_document.pdf"],
  "pageCount": 5,
  "pdfId": "1704067200000_document.pdf",
  "roomCode": "ABC12",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Image Upload Message
```json
{
  "type": "file",
  "fileType": "image",
  "url": "http://192.168.50.121:3000/uploads/ABC12/image/1704067250000_photo.jpg",
  "roomCode": "ABC12",
  "timestamp": "2024-01-01T12:05:00.000Z"
}
```

### Video Upload Message
```json
{
  "type": "file",
  "fileType": "video",
  "url": "http://192.168.50.121:3000/uploads/ABC12/video/1704067300000_clip.mp4",
  "roomCode": "ABC12",
  "timestamp": "2024-01-01T12:10:00.000Z"
}
```

## Message Structure

### Common Fields
- `type`: Always "file" for file uploads
- `fileType`: One of "pdf", "image", or "video"
- `url`: Direct URL to access the uploaded file
- `roomCode`: Session/room code where the file was uploaded
- `timestamp`: ISO timestamp when the file was uploaded

### PDF-Specific Fields
- `urls`: Array of URLs (for future multi-page support)
- `pageCount`: Number of pages in the PDF
- `pdfId`: Unique identifier for the PDF file

## WebSocket Connection

These messages are sent through the annotation WebSocket connection to:
- **URL**: `ws://65.2.144.151:8081` (or configured annotation URL)
- **Client Type**: "web"
- **Room Code**: The session code for the current session

## Environment Configuration

The file URLs sent to Unity are configured via environment variables:

```bash
# In .env.local
NEXT_PUBLIC_UPLOAD_BASE_URL=http://192.168.50.121:3000
```

This ensures Unity receives URLs with the correct IP address instead of localhost, allowing Unity to properly access the uploaded files from the annotation controller.

## Unity Integration

Unity should listen for messages with `type: "file"` and handle them based on the `fileType`:

```csharp
// Example Unity C# handler (pseudo-code)
public void OnWebSocketMessage(string message) {
    var data = JsonUtility.FromJson<FileMessage>(message);
    
    if (data.type == "file") {
        switch (data.fileType) {
            case "pdf":
                HandlePDFUpload(data.url, data.pageCount, data.pdfId);
                break;
            case "image":
                HandleImageUpload(data.url);
                break;
            case "video":
                HandleVideoUpload(data.url);
                break;
        }
    }
}
```

## File Access

All files are accessible via HTTP GET requests to the provided URLs:
- **Development**: `http://localhost:3000` (for local browser access)
- **Unity**: `http://192.168.50.121:3000` (configured via `NEXT_PUBLIC_UPLOAD_BASE_URL`)
- **Full URL example**: `http://192.168.50.121:3000/uploads/ABC12/image/1704067250000_photo.jpg`

**Note**: Unity receives full URLs in the WebSocket messages, so no additional URL construction is needed.
