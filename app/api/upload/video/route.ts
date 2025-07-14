import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const annotationRoomCode = formData.get('annotationRoomCode') as string;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    if (!annotationRoomCode) {
      return NextResponse.json({ success: false, error: 'Session code is required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Please upload a video file.' }, { status: 400 });
    }

    console.log('🎞️ Video upload started:', {
      name: file.name,
      size: file.size,
      type: file.type,
      roomCode: annotationRoomCode
    });

    // Create directory structure: /uploads/<session-code>/video/
    const uploadDir = join(process.cwd(), 'public', 'uploads', annotationRoomCode, 'video');
    
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('📁 Created directory:', uploadDir);
    } catch (error) {
      console.log('📁 Directory already exists or creation failed:', error);
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${timestamp}_${file.name}`;
    const filePath = join(uploadDir, uniqueFilename);
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    console.log('✅ File saved to:', filePath);
    
    // Generate public URL path
    const publicUrl = `/uploads/${annotationRoomCode}/video/${uniqueFilename}`;
    
    // For now, return mock duration
    // In production, you'd process the video and get actual duration
    const mockDuration = Math.floor(Math.random() * 300) + 30; // Random 30-330 seconds
    
    console.log('🎞️ Video uploaded successfully:', {
      originalName: file.name,
      savedAs: uniqueFilename,
      url: publicUrl,
      size: file.size,
      duration: mockDuration,
      roomCode: annotationRoomCode
    });
    
    return NextResponse.json({ 
      success: true,
      type: 'video',
      url: publicUrl,
      filename: file.name,
      savedFilename: uniqueFilename,
      size: file.size,
      duration: mockDuration,
      roomCode: annotationRoomCode
    });
    
  } catch (error) {
    console.error('❌ Video upload error:', error);
    return NextResponse.json({ 
      success: false,
      error: `Video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
