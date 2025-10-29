// Test with Gemini 2.0 Flash and other correct model names
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testCorrectModels() {
  const apiKey = "AIzaSyDQuCYOYOjK7RtgGZ3NdGM1047D5-kld0E";
  
  console.log('🔍 Testing with Correct Gemini Model Names');
  console.log('==========================================');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Test with Gemini 2.0 Flash and other correct model names
  const correctModels = [
    "gemini-2.0-flash-exp",  // Gemini 2.0 Flash Experimental
    "gemini-2.0-flash",      // Gemini 2.0 Flash
    "gemini-1.5-flash",      // Standard 1.5 Flash
    "gemini-1.5-pro",        // Standard 1.5 Pro
    "gemini-pro",            // Standard Pro
    "gemini-1.0-pro"         // Legacy Pro
  ];
  
  for (const modelName of correctModels) {
    try {
      console.log(`\n🧪 Testing ${modelName}...`);
      
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello in one word");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} WORKS!`);
      console.log(`   Response: ${text}`);
      
      // Test question generation with the working model
      console.log(`\n📝 Testing question generation with ${modelName}...`);
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
      
      console.log(`✅ Question generation works with ${modelName}!`);
      console.log(`   Response preview: ${questionText.substring(0, 200)}...`);
      
      console.log(`\n🎉 FOUND WORKING MODEL: ${modelName}`);
      console.log(`   Update your routes/documents.js to use: ${modelName}`);
      
      return modelName;
      
    } catch (error) {
      console.log(`❌ ${modelName} failed: ${error.message}`);
    }
  }
  
  console.log('\n❌ No working model found');
  return null;
}

testCorrectModels();
