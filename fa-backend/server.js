// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const { VertexAI } = require('@google-cloud/vertexai');

const app = express();
const port = process.env.PORT || 5000; // Use port 5000 for backend

// Middleware to enable CORS for all origins (for development)
app.use(cors());
// Middleware to parse JSON request bodies
app.use(express.json());

// --- Google Cloud Initialization ---
// Initialize Google Cloud Storage client
// Requires GOOGLE_APPLICATION_CREDENTIALS environment variable to be set for local development
const storage = new Storage();

// Initialize Vertex AI client
// Project ID and location are crucial for Vertex AI.
// It's highly recommended to use environment variables for these in production.
// For development, ensure your GOOGLE_APPLICATION_CREDENTIALS points to a service account
// with Vertex AI User and Storage Object Viewer roles.
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-gcp-project-id'; // !!! IMPORTANT: Replace with your GCP Project ID
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'; // Or your desired GCP region

const vertexAI = new VertexAI({ project: projectId, location: location });

// Example: Get a generative model instance
const model = 'gemini-1.5-flash'; // Or 'gemini-pro', 'gemini-1.0-pro'
const generativeModel = vertexAI.get  GenerativeModel({
  model: model,
  // Optional: Set up generation configuration
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.2,
    topP: 0.9,
    topK: 40,
  },
});


// --- RAG Placeholder Logic (Students will enhance this) ---

// In-memory "vector store" for simplicity in this project.
// In a real application, you'd use a dedicated vector database (e.g., Pinecone, Weaviate, pgvector).
let documentChunks = []; // Stores { text: "...", source: "..." }
let chunkEmbeddings = []; // Stores embeddings corresponding to documentChunks

// Function to simulate loading and embedding documents
// In a real scenario, this would be triggered by a document upload or batch process.
async function initializeDocumentKnowledgeBase() {
  console.log('Initializing document knowledge base...');
  try {
    // --- STEP 1: Load Documents from Google Cloud Storage ---
    const bucketName = process.env.GCS_BUCKET_NAME || 'fidgetech-rag-docs'; // !!! IMPORTANT: Replace with your GCS Bucket Name
    const [files] = await storage.bucket(bucketName).getFiles();

    for (const file of files) {
      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        console.log(`Loading file: ${file.name}`);
        const [contents] = await file.download();
        const textContent = contents.toString('utf8');

        // --- STEP 2: Simple Text Chunking ---
        // For a real RAG app, use a more sophisticated chunking strategy
        // (e.g., based on sentences, paragraphs, or specific token limits).
        // This simple split is just for demonstration.
        const chunks = textContent.split('\n\n').filter(chunk => chunk.trim().length > 50); // Split by double newline, filter short chunks

        // --- STEP 3: Generate Embeddings for Chunks ---
        const embeddingModel = vertexAI.getGenerativeModel({
            model: 'text-embedding-004', // Or 'text-embedding-gecko@001'
        });

        for (const chunk of chunks) {
          try {
            const embedRequest = {
              content: {
                parts: [{ text: chunk }]
              }
            };
            const embedResponse = await embeddingModel.embedContent(embedRequest);
            const embedding = embedResponse.embeddings[0].values; // Assuming one embedding per part

            documentChunks.push({ text: chunk, source: file.name });
            chunkEmbeddings.push(embedding);

          } catch (embedError) {
            console.error(`Error embedding chunk from ${file.name}:`, embedError);
          }
        }
      }
    }
    console.log(`Knowledge base initialized with ${documentChunks.length} chunks.`);
  } catch (err) {
    console.error('Failed to initialize document knowledge base:', err);
    console.warn('Ensure your GCP_BUCKET_NAME is correct and your service account has Storage Object Viewer role.');
  }
}

// Call the initialization function when the server starts
initializeDocumentKnowledgeBase();


// --- Helper function for Cosine Similarity (simplified for demo) ---
function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must be of the same length");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / (magnitude1 * magnitude2);
}


// --- API Endpoints ---

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('Fidgetech AI Backend is running!');
});

// Main RAG Q&A endpoint
app.post('/ask', async (req, res) => {
  const userQuery = req.body.query;

  if (!userQuery) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  try {
    // --- STEP 4: Generate Embedding for User Query ---
    const embeddingModel = vertexAI.getGenerativeModel({
        model: 'text-embedding-004',
    });
    const queryEmbedRequest = {
      content: {
        parts: [{ text: userQuery }]
      }
    };
    const queryEmbedResponse = await embeddingModel.embedContent(queryEmbedRequest);
    const queryEmbedding = queryEmbedResponse.embeddings[0].values;

    // --- STEP 5: Retrieve Top K Relevant Chunks ---
    const similarities = chunkEmbeddings.map((embed, index) => ({
      index: index,
      score: cosineSimilarity(queryEmbedding, embed)
    }));

    // Sort by score in descending order and get top K (e.g., top 3)
    const topK = 3;
    const relevantChunksInfo = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(item => item.score > 0.6); // Filter out low-similarity chunks

    const retrievedContexts = relevantChunksInfo.map(info => documentChunks[info.index].text);
    const retrievedSources = relevantChunksInfo.map(info => documentChunks[info.index].source);

    // --- STEP 6: Construct Augmented Prompt for LLM ---
    // This is a key area for students to experiment with prompt engineering!
    let prompt = `You are an expert technical assistant for Fidgetech.
    Use the following retrieved information to answer the user's question.
    If the information does not contain the answer, state that you cannot find the answer in the provided documents.
    Be concise and helpful.

    Retrieved Information:
    ${retrievedContexts.length > 0 ? retrievedContexts.map(chunk => `- ${chunk}`).join('\n') : 'No relevant information found.'}

    User's Question: ${userQuery}`;

    console.log("Sending prompt to LLM:\n", prompt); // Log the full prompt for debugging

    // --- STEP 7: Call Vertex AI Generative Model ---
    const chat = generativeModel.startChat({}); // Using startChat for a simple single turn
    const result = await chat.sendMessage(prompt);
    const llmResponse = result.response.candidates[0].content.parts[0].text;

    // --- Send back the response ---
    res.json({
      answer: llmResponse,
      retrieved_chunks: retrievedContexts,
      source_titles: retrievedSources
    });

  } catch (llmError) {
    console.error('Error during AI processing:', llmError);
    res.status(500).json({ error: 'Failed to get answer from AI. Please check server logs.', details: llmError.message });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Fidgetech AI Backend listening at http://localhost:${port}`);
  console.log('Remember to set GOOGLE_APPLICATION_CREDENTIALS for local GCP access.');
});
