import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

// 🔥🔥 FILL THIS OUT FIRST! 🔥🔥
// Get your Gemini API key by:
// - Selecting "Add Gemini API" in the "Project IDX" panel in the sidebar
// - Or by visiting https://g.co/ai/idxGetGeminiKey
let API_KEY = 'AIzaSyB4bhBx8KhNIP23TuITtefDiwBTyvZSoW4'; // Replace with your API Key

let form = document.querySelector('form');
let promptInput = document.querySelector('textarea[name="prompt"]'); // Use textarea for the prompt
let output = document.querySelector('.output');
let imageUpload = document.getElementById('imageUpload');
let uploadedImage = document.getElementById('uploadedImage');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    // Load the image as a base64 string
    const file = imageUpload.files[0];

    if (!file) {
      output.textContent = 'Please select an image to upload.';
      return;
    }

    let imageBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // Extract base64 part
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    uploadedImage.src = `data:image/jpeg;base64,${imageBase64}`;

    // Assemble the prompt by combining the text with the chosen image
    let contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64, } },
          { text: promptInput.value }
        ]
      }
    ];

    // Call the multimodal model, and get a stream of results
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // or gemini-1.5-pro
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents });

    // Read from the stream and interpret the output as markdown
    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
    }

    // Assume the response contains a reason (using the full buffer as the reason)
    const finalReason = buffer.join('');

    // Placeholder for determining score based on response content
    const determineScore = (reason) => {
      // Example logic to determine score based on the reason's content
      if (reason.includes('harmony') || reason.includes('mesmerizing') || reason.includes('intensity')) {
        return 90;
      } else if (reason.includes('perspective') || reason.includes('texture')) {
        return 80;
      } else if (reason.includes('dynamic')) {
        return 70;
      } else {
        return 60;
      }
    };

    const apiResponse = {
      score: determineScore(finalReason),
      reason: finalReason || "The AI-generated response did not provide a detailed reason."
    };

    // Clear previous output and display the results
    output.innerHTML = `
      <h2>Score: ${apiResponse.score}</h2>
      <p>Reason: ${apiResponse.reason}</p>
    `;

    // Apply CSS styling to .output
    output.style.border = '1px solid #ccc';
    output.style.padding = '15px';
    output.style.marginTop = '20px';
    output.style.backgroundColor = '#f8f8f8';
    output.style.borderRadius = '5px';

    output.querySelector('h2').style.fontSize = '1.5em';
    output.querySelector('h2').style.color = '#333';

    output.querySelector('p').style.fontSize = '1em';
    output.querySelector('p').style.lineHeight = '1.5';

  } catch (e) {
    // Clear previous output and display error message
    output.innerHTML = 'API call failed.';

    // Apply CSS styling to .output
    output.style.border = '1px solid #ccc';
    output.style.padding = '15px';
    output.style.marginTop = '20px';
    output.style.backgroundColor = '#f8f8f8';
    output.style.borderRadius = '5px';

    output.querySelector('h2').style.fontSize = '1.5em';
    output.querySelector('h2').style.color = '#333';

    output.querySelector('p').style.fontSize = '1em';
    output.querySelector('p').style.lineHeight = '1.5';
  }
};

// You can delete this once you've filled out an API key
maybeShowApiKeyBanner(API_KEY);
