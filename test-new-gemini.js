// Quick test for new Gemini API key
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

async function testNewGeminiKey() {
  try {
    console.log('🧪 Testing new Gemini API key...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log('Sending test request...');
    const result = await model.generateContent("Say hello in one word");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Success! Response:', text);
    console.log('🎉 Your Gemini API key is working perfectly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try alternative model names
    const alternativeModels = ['gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
    
    for (const modelName of alternativeModels) {
      try {
        console.log(`\nTrying alternative model: ${modelName}`);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("Hello");
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ ${modelName} works! Response:`, text);
        console.log(`🎉 Use this model: ${modelName}`);
        break;
        
      } catch (err) {
        console.log(`❌ ${modelName} failed: ${err.message}`);
      }
    }
  }
}

testNewGeminiKey();
