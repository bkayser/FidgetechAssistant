import type {ChangeEvent, FormEvent} from 'react';
import React, {useState} from 'react';

// Define the shape of a retrieved chunk and the overall response
interface RetrievedChunk {
    // Assuming a chunk has at least a text content, and possibly other metadata
    // Adjust this interface based on the actual structure your backend returns for chunks
    text: string;
    // Add more properties if your backend sends them, e.g., 'score', 'start_index'
}

interface ApiResponse {
    answer: string;
    retrieved_chunks?: string[]; // Assuming backend sends string array of chunks
    source_titles?: string[];   // Assuming backend sends string array of source titles
}

// Main App component
function Home() {
    const [query, setQuery] = useState<string>('');
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // You would typically get this from an environment variable or config
    // For local development, this assumes the backend is running on localhost:8080
    let BACKEND_API_URL: string = (window as any).BACKEND_API_URL || 'http://localhost:8080'; // Fallback to local if not set
    if (BACKEND_API_URL == "__BACKEND_API_URL__") {
        BACKEND_API_URL = 'http://localhost:8080'; // Default to local backend for development
        console.log(`Using default API URL: ${BACKEND_API_URL}.`)
    }
    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!query.trim()) {
            setError('Please enter a question.');
            return;
        }

        setLoading(true);
        setResponse(null);
        setError(null);

        try {
            // Make a POST request to your backend's /ask endpoint
            const res: Response = await fetch(`${BACKEND_API_URL}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({query}),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Something went wrong on the server.');
            }

            const data: ApiResponse = await res.json();
            setResponse(data); // Expecting { answer: "...", retrieved_chunks: [], source_titles: [] }

        } catch (err: any) { // Use 'any' for unknown error types from fetch, or define a custom Error interface
            console.error('Fetch error:', err);
            setError(`Failed to fetch response: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4 font-sans antialiased">
            <div
                className="bg-white rounded-xl shadow-2xl p-8 md:p-10 w-full max-w-2xl transform transition-all duration-300 hover:scale-[1.01] focus-within:scale-[1.01]">
                <h1 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 mb-6 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500">
            Fidgetech AI Q&A Bot
          </span>
                </h1>
                <p className="text-center text-gray-600 mb-8 max-w-md mx-auto">
                    Ask questions about technical documentation. The AI will provide answers using Retrieval Augmented
                    Generation (RAG).
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
              className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 resize-y min-h-[100px]"
              placeholder="Ask a question about your documents, e.g., 'What is React state?' or 'How does prompt engineering work?'"
              value={query}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
              rows={4}
          ></textarea>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                                     fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Get Answer'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm"
                         role="alert">
                        {error}
                    </div>
                )}

                {response && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">AI's Answer:</h2>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-inner text-gray-800 leading-relaxed text-lg">
                            <p>{response.answer}</p>
                        </div>

                        {/* Students' Task: Display Retrieved Chunks and Sources */}
                        {response.retrieved_chunks && response.retrieved_chunks.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd"
                                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L14.414 5A2 2 0 0115 6.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h7V6.414L10.586 4H6z"
                                              clipRule="evenodd"></path>
                                    </svg>
                                    Sources Used:
                                </h3>
                                <ul className="space-y-3">
                                    {response.retrieved_chunks.map((chunk, index) => (
                                        <li key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="font-medium text-blue-800 text-sm mb-1">Snippet
                                                from: {response.source_titles && response.source_titles[index] ? response.source_titles[index] : 'Unknown Source'}</p>
                                            <p className="text-gray-700 text-sm italic">"{chunk.substring(0, 150)}..."</p> {/* Displaying a truncated snippet */}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-gray-500 text-xs mt-2">
                                    (Students will enhance this section to show full chunks or better formatted
                                    sources.)
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;

