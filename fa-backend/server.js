// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const { VertexAI } = require('@google-cloud/vertexai');
// Add the AI Platform client for a more direct embedding method
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
const { helpers } = require('@google-cloud/aiplatform');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// --- Google Cloud Initialization ---
const storage = new Storage();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-gcp-project-id';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

// Basic validation for critical environment variables
if (projectId === 'your-gcp-project-id' || !projectId) {
  console.error('ERROR: GOOGLE_CLOUD_PROJECT_ID is not set. Please update your .env file.');
  process.exit(1);
}
if (!process.env.GCS_BUCKET_NAME) {
  console.error('ERROR: GCS_BUCKET_NAME is not set. Please update your .env file.');
  process.exit(1);
}

// --- Client for Text Generation (Gemini) ---
const vertexAI = new VertexAI({ project: projectId, location: location });
const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.2,
    topP: 0.9,
    topK: 40,
  },
});

// --- Client for Embeddings ---
const predictionServiceClient = new PredictionServiceClient({
  apiEndpoint: `${location}-aiplatform.googleapis.com`,
});


// --- RAG Logic ---
let documentChunks = [];
let chunkEmbeddings = [];

/**
 * Generates an embedding for a single piece of text using the PredictionServiceClient.
 * @param {string} text The text to embed.
 * @returns {Promise<number[]|null>} The embedding vector or null if an error occurs.
 */
async function embedText(text) {
  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/text-embedding-004`;
  const instance = helpers.toValue({ content: text });
  const request = {
    endpoint,
    instances: [instance],
  };

  try {
    const [response] = await predictionServiceClient.predict(request);

    // *** FIX: Navigating the deeply nested structure provided in the error log. ***
    // Use optional chaining (?.) for safety to prevent 'cannot read properties of undefined' errors.
    const valuesList = response.predictions?.[0]?.structValue?.fields?.embeddings?.structValue?.fields?.values?.listValue?.values;

    if (valuesList) {
      // The result is a list of objects like { numberValue: ... }, so we map to get the numbers.
      return valuesList.map(v => v.numberValue);
    } else {
      // Log an error if the structure is not what we expect, including the full response for debugging.
      console.error(`Unexpected embedding response structure for chunk starting with "${text.substring(0,50)}...":`);
      console.error('Full response object:', JSON.stringify(response, null, 2));
      return null;
    }
  } catch (error) {
    console.error(`Error during prediction API call for chunk starting with "${text.substring(0,50)}...":`, error.details || error.message);
    return null; // Return null to indicate failure
  }
}

/**
 * Initializes the knowledge base by downloading documents from GCS,
 * chunking them, generating embeddings, and storing them in memory.
 */
async function initializeDocumentKnowledgeBase() {
  console.log('Initializing document knowledge base...');
  const bucketName = process.env.GCS_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME environment variable is required.');
  }

  try {
    console.log(`Attempting to list files in GCS bucket: ${bucketName}`);
    const [files] = await storage.bucket(bucketName).getFiles();
    const validFiles = files.filter(file => (file.name.endsWith('.txt') || file.name.endsWith('.md')) && !file.name.endsWith('/'));
    console.log(`Found ${validFiles.length} valid text/markdown files.`);

    for (const file of validFiles) {
      console.log(`Processing document: ${file.name}`);
      try {
        const [contents] = await file.download();
        const textContent = contents.toString('utf8');
        console.log(`Downloaded ${textContent.length} bytes from ${file.name}`);

        const chunks = textContent.split(/[\n\n\r\r]+|\.|\?|!/).filter(chunk => chunk.trim().length > 50);
        console.log(`Split ${file.name} into ${chunks.length} chunks.`);

        for (const chunk of chunks) {
          // print the first 50 characters of the chunk for debugging
            console.log(`Processing chunk: "${chunk.substring(0, 50)}..."`);
          const embedding = await embedText(chunk);
          if (embedding) {
            documentChunks.push({ text: chunk, source: file.name });
            chunkEmbeddings.push(embedding);
          }
        }
      } catch (downloadOrProcessError) {
        console.error(`Error processing file ${file.name}:`, downloadOrProcessError);
      }
    }
    console.log(`Knowledge base initialized with ${documentChunks.length} chunks.`);
  } catch (err) {
    console.error('Failed to initialize document knowledge base:', err);
    throw err;
  }
}


/**
 * Calculates the cosine similarity between two vectors.
 */
function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }
  let dotProduct = 0, magnitude1 = 0, magnitude2 = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}


// --- API Endpoints ---
app.get('/', (req, res) => {
  res.status(200).send('Fidgetech AI Backend is running!');
});

app.post('/ask', async (req, res) => {
  const userQuery = req.body.query;
  if (!userQuery) return res.status(400).json({ error: 'Query is required.' });
  if (documentChunks.length === 0) return res.status(503).json({ error: 'Knowledge base not ready or empty.' });

  try {
    const queryEmbedding = await embedText(userQuery);
    if (!queryEmbedding) {
      return res.status(500).json({ error: 'Failed to embed user query.' });
    }

    const similarities = chunkEmbeddings.map((embed, index) => ({
      index: index,
      score: cosineSimilarity(queryEmbedding, embed)
    }));

    const topK = 3;
    const relevantChunksInfo = similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter(item => item.score > 0.6);

    const retrievedContexts = relevantChunksInfo.map(info => documentChunks[info.index].text);
    const retrievedSources = [...new Set(relevantChunksInfo.map(info => documentChunks[info.index].source))];

    const prompt = `The user is a parent of a soccer player and you are an expert on the league policies and rules.  Use the following retrieved information to answer the user's question.  If the information does not contain the answer, state that the Soccer5 league rules do not address the issue and the user should instead consult the rules of soccer found at footballrules.com. Be concise and helpful.\n\nRetrieved Information:\n${retrievedContexts.length > 0 ? retrievedContexts.map(chunk => `- ${chunk}`).join('\n') : 'No relevant information found.'}\n\nUser's Question: ${userQuery}`;
                //`You are an expert technical assistant for Fidgetech. Use the following retrieved information to answer the user's question. If the information does not contain the answer, state that you cannot find the answer in the provided documents. Be concise and helpful.\n\nRetrieved Information:\n${retrievedContexts.length > 0 ? retrievedContexts.map(chunk => `- ${chunk}`).join('\n') : 'No relevant information found.'}\n\nUser's Question: ${userQuery}`;

    console.log("Sending prompt to LLM...");
    const chat = generativeModel.startChat({});
    const result = await chat.sendMessage(prompt);
    const llmResponse = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "I am sorry, but I encountered an issue generating a response.";

    res.json({
      answer: llmResponse,
      retrieved_chunks: retrievedContexts,
      source_titles: retrievedSources
    });

  } catch (llmError) {
    console.error('Error during AI processing:', llmError);
    res.status(500).json({ error: 'Failed to get answer from AI.', details: llmError.message });
  }
});

/**
 * Starts the server after initializing the knowledge base.
 */
async function startServer() {
  try {
    await initializeDocumentKnowledgeBase();
    app.listen(port, () => {
      console.log(`Fidgetech AI Backend listening at http://localhost:${port}`);
    });
  } catch (startupError) {
    console.error('Server failed to start due to initialization error:', startupError);
    process.exit(1);
  }
}

startServer();
