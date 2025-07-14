import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionCode = searchParams.get('sessionCode');
    
    if (!sessionCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session code is required' 
      }, { status: 400 });
    }

    const sessionDir = join(process.cwd(), 'public', 'uploads', sessionCode);
    
    const files: any = {
      pdf: [],
      image: [],
      video: []
    };

    // Check each file type directory
    for (const fileType of ['pdf', 'image', 'video']) {
      const typeDir = join(sessionDir, fileType);
      
      try {
        const fileList = await readdir(typeDir);
        
        for (const filename of fileList) {
          const filePath = join(typeDir, filename);
          const stats = await stat(filePath);
          
          files[fileType].push({
            filename,
            url: `/uploads/${sessionCode}/${fileType}/${filename}`,
            size: stats.size,
            uploadTime: stats.mtime,
            isFile: stats.isFile()
          });
        }
      } catch (error) {
        // Directory doesn't exist or is empty, that's okay
        console.log(`📁 Directory ${typeDir} doesn't exist or is empty`);
      }
    }

    return NextResponse.json({
      success: true,
      sessionCode,
      files,
      totalFiles: files.pdf.length + files.image.length + files.video.length
    });

  } catch (error) {
    console.error('❌ Error listing files:', error);
    return NextResponse.json({ 
      success: false,
      error: `Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
