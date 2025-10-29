// Comprehensive Gemini API test with different approaches
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

async function testGeminiComprehensive() {
  console.log('🔍 Comprehensive Gemini API Test');
  console.log('================================');
  console.log('API Key:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
  console.log('Key length:', process.env.GEMINI_API_KEY?.length || 0);
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ No API key found');
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Test different model names and configurations
  const testConfigs = [
    { model: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    { model: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { model: "gemini-pro", name: "Gemini Pro" },
    { model: "gemini-1.0-pro", name: "Gemini 1.0 Pro" },
    { model: "gemini-1.5-flash-002", name: "Gemini 1.5 Flash 002" },
    { model: "gemini-1.5-pro-002", name: "Gemini 1.5 Pro 002" }
  ];

  for (const config of testConfigs) {
    try {
      console.log(`\n🧪 Testing ${config.name} (${config.model})...`);
      
      const model = genAI.getGenerativeModel({ 
        model: config.model,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });
      
      const result = await model.generateContent("Say hello");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${config.name} WORKS!`);
      console.log(`   Response: ${text}`);
      console.log(`   🎉 Use this model: ${config.model}`);
      
      // Test with a more complex prompt
      console.log(`\n📝 Testing question generation with ${config.name}...`);
      const questionResult = await model.generateContent(`
      Generate a simple test question in JSON format:
      {
        "questions": [
          {
            "type": "mcq",
            "question": "What is 2+2?",
            "options": ["3", "4", "5", "6"],
            "correctAnswer": "4",
            "explanation": "2+2 equals 4"
          }
        ]
      }`);
      
      const questionResponse = await questionResult.response;
      const questionText = questionResponse.text();
      
      console.log(`✅ Question generation works!`);
      console.log(`   Response preview: ${questionText.substring(0, 200)}...`);
      
      return config.model; // Return the working model
      
    } catch (error) {
      console.log(`❌ ${config.name} failed: ${error.message}`);
      
      // Check for specific error types
      if (error.message.includes('API key expired')) {
        console.log(`   🔑 API key issue detected`);
      } else if (error.message.includes('404 Not Found')) {
        console.log(`   🚫 Model not available`);
      } else if (error.message.includes('API_KEY_INVALID')) {
        console.log(`   🔑 Invalid API key`);
      } else {
        console.log(`   ⚠️  Other error: ${error.message}`);
      }
    }
  }
  
  console.log('\n❌ No working model found');
  console.log('\n🔧 Troubleshooting suggestions:');
  console.log('1. Check if your API key has the right permissions');
  console.log('2. Verify the API key is correctly copied');
  console.log('3. Check if Gemini API is enabled in your Google Cloud project');
  console.log('4. Try creating a new API key');
}

testGeminiComprehensive();
