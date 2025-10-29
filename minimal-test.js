// Minimal Gemini API test
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

async function testGemini() {
  try {
    console.log('Testing Gemini API with minimal request...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try the most basic model
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Success! Response:', text);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try with different API configuration
    try {
      console.log('\nTrying with different configuration...');
      const genAI2 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model2 = genAI2.getGenerativeModel({ 
        model: "gemini-1.0-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });
      
      const result2 = await model2.generateContent("Hello");
      const response2 = await result2.response;
      const text2 = response2.text();
      
      console.log('✅ Success with config! Response:', text2);
      
    } catch (error2) {
      console.error('❌ Still failed:', error2.message);
    }
  }
}

testGemini();
