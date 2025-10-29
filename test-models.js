// Test to list available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    process.env[key.trim()] = value;
  }
});

async function listModels() {
  try {
    console.log('Listing available Gemini models...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try to list models
    const models = await genAI.listModels();
    console.log('Available models:', models);
    
  } catch (error) {
    console.error('Error listing models:', error.message);
    
    // Try different model names
    const modelNames = [
      'gemini-1.5-flash',
      'gemini-1.5-pro', 
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.5-flash-002',
      'gemini-1.5-pro-002'
    ];
    
    console.log('\nTrying different model names...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    for (const modelName of modelNames) {
      try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ ${modelName} works!`);
        break;
      } catch (err) {
        console.log(`❌ ${modelName} failed: ${err.message}`);
      }
    }
  }
}

listModels();
