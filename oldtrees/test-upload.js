#!/usr/bin/env node

// Simple test script to check image upload functionality
// Run with: node test-upload.js

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  console.log('Testing image upload functionality...');

  // Check if uploads directory exists
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  console.log('Uploads directory:', uploadsDir);
  console.log('Uploads directory exists:', fs.existsSync(uploadsDir));

  // List files in uploads directory
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log('Files in uploads directory:', files.length);
    files.slice(0, 5).forEach(file => {
      const stats = fs.statSync(path.join(uploadsDir, file));
      console.log(`  ${file}: ${stats.size} bytes, ${stats.mtime}`);
    });
  }

  // Create a simple test image file
  const testImagePath = path.join(__dirname, 'test-image.png');
  console.log('\nCreating test image...');

  // For this test, we'll just check if we can create a basic file
  // In a real scenario, you'd create an actual image
  const testData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(testImagePath, testData);
  console.log('Test image created at:', testImagePath);

  console.log('\nUpload test completed. Check the server logs when running the app.');
  console.log('Use the "Test Upload" button in the admin dashboard to test the actual upload.');
}

testUpload().catch(console.error);