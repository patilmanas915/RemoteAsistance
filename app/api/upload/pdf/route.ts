import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  console.log('📄 PDF upload endpoint called');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const annotationRoomCode = formData.get('annotationRoomCode') as string;
    
    console.log('📄 Received form data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      roomCode: annotationRoomCode
    });
    
    if (!file) {
      console.log('❌ No file uploaded');
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    if (!annotationRoomCode) {
      return NextResponse.json({ success: false, error: 'Session code is required' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ success: false, error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 });
    }

    // Create directory structure: /uploads/<session-code>/pdf/
    const uploadDir = join(process.cwd(), 'public', 'uploads', annotationRoomCode, 'pdf');
    
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('📁 Created directory:', uploadDir);
    } catch (error) {
      console.log('📁 Directory already exists or creation failed:', error);
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    //const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${timestamp}_${file.name}`;
    const filePath = join(uploadDir, uniqueFilename);
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    console.log('✅ File saved to:', filePath);
    
    // Generate public URL path
    const publicUrl = `/uploads/${annotationRoomCode}/pdf/${uniqueFilename}`;
    
    // For now, return mock page count
    // In production, you'd process the PDF and count actual pages
    const mockPageCount = Math.floor(Math.random() * 10) + 1; // Random 1-10 pages

    console.log('✅ PDF uploaded successfully:', {
      originalName: file.name,
      savedAs: uniqueFilename,
      url: publicUrl,
      size: file.size,
      pageCount: mockPageCount,
      roomCode: annotationRoomCode
    });
      return NextResponse.json({ 
      success: true,
      type: 'pdf',
      url: publicUrl,
      urls: [publicUrl], // Array for Unity compatibility - could be multiple pages in future
      pageCount: mockPageCount,
      filename: file.name,
      savedFilename: uniqueFilename,
      size: file.size,
      roomCode: annotationRoomCode
    });
    
  } catch (error) {
    console.error('❌ PDF upload error:', error);
    return NextResponse.json({ 
      success: false,
      error: `PDF upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
