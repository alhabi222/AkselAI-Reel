
'use server';

/**
 * @fileOverview This file defines a Genkit flow for handling chat interactions with an AI partner.
 *
 * executeInstruction - A function that generates a response from an AI partner based on the chat history and skill.
 * ExecuteInstructionInput - The input type for the executeInstruction function.
 * ExecuteInstructionOutput - The output type for the executeInstruction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'tool']),
  content: z.string(),
});

const ExecuteInstructionInputSchema = z.object({
  partnerSlug: z.string().describe("The unique slug of the AI partner."),
  skill: z.string().describe("The AI partner's specialized skill."),
  history: z.array(MessageSchema).describe('The history of the conversation.'),
  version: z.number().describe('The current version of the AI partner, indicating its experience level.'),
  config: z.record(z.any()).optional().describe("An optional configuration object for the partner, which can hold API keys or other settings."),
});
export type ExecuteInstructionInput = z.infer<typeof ExecuteInstructionInputSchema>;

const ExecuteInstructionOutputSchema = z.object({
  response: z.string().describe("The AI partner's response."),
});
export type ExecuteInstructionOutput = z.infer<typeof ExecuteInstructionOutputSchema>;

export async function executeInstruction(input: ExecuteInstructionInput): Promise<ExecuteInstructionOutput> {
  return executeInstructionFlow(input);
}

// Define the tool for getting a stock price
const getStockPrice = ai.defineTool(
  {
    name: 'getStockPrice',
    description: 'Returns the current market value of a specific stock ticker.',
    inputSchema: z.object({
      ticker: z.string().describe('The stock ticker symbol, e.g., GOOGL, MSFT.'),
      // The partner's config is passed through to the tool's context.
      config: z.record(z.any()).optional(),
    }),
    outputSchema: z.number().describe('The current stock price.'),
  },
  async ({ ticker, config }) => {
    console.log(`Tool called: getStockPrice for ${ticker}`);
    
    // Prioritize partner-specific API key, then fallback to global environment variable.
    const apiKey = config?.apiKey || process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
        throw new Error("Alpha Vantage API key is not configured. Please add it to the partner's config or the src/ai/.env file.");
    }
      
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Alpha Vantage API request failed with status ${response.status}`);
      }
      const data = await response.json();
      
      // Check for API usage note which often indicates a rate limit or invalid key
      if (data.Note) {
        console.warn('Alpha Vantage API Note:', data.Note);
        throw new Error('Alpha Vantage API limit reached. Please try again later or use a different API key.');
      }

      const price = data?.['Global Quote']?.['05. price'];

      if (!price) {
        console.error('Price not found in Alpha Vantage response for ticker:', ticker, data);
        throw new Error(`Could not retrieve the stock price for ${ticker}. The symbol may be invalid, or the API key is not valid or has reached its limit.`);
      }
      
      return parseFloat(price);

    } catch (error) {
      console.error('Error fetching stock price from Alpha Vantage:', error);
      // Re-throw the error to be handled by the flow
      throw error;
    }
  }
);


const defaultSystemPrompt = `You are a world-class AI assistant acting as a real work partner. Your expertise is in {{skill}}.
Your partner version, {{version}}, reflects your experience level. A higher version means you are more senior and should provide deeper insights.

**Core Directives (Human-in-the-Loop & Proactive Execution)**:
1.  **Think then Act**: Your first priority is to determine if you can use one of your specialized \`Tools\` to provide a more accurate, data-driven answer. If the user's request matches your tool's capability, you **must** proactively use it. Do not invent answers when a tool can provide facts.
2.  **Clarification Protocol**: If a user's request is ambiguous or lacks the necessary detail to use a tool, your priority is to clarify. Form a hypothesis about their intent and ask a guiding question to confirm. For example, if you need a city name to use a tool, ask for it.
3.  **Predict & Suggest (Return Control to Human)**: After fulfilling a request (especially after using a tool), you **must** predict the user's next logical need. Conclude your response by suggesting a relevant follow-up action or asking a guiding question. This passes the control back to the human.
4.  **Incorporate Your Experience (Version-Based Insight)**:
    - **v1.0 - v1.9 (Junior Analyst):** Focus on accurately executing the request and using tools correctly. Your suggested next steps can be direct and simple.
    - **v2.0 - v2.9 (Analyst):** After providing the core data, add a layer of analysis. For example, if you provide a stock price, also mention its 52-week high/low if that data were available. Your suggestions should be more analytical.
    - **v3.0+ (Senior Advisor):** Provide the data, the analysis, and also strategic implications. Connect the data to broader trends. Your suggestions should be strategic and forward-looking, anticipating needs the user hasn't even mentioned yet.

**Instructions for Tool Use**:
- **Finance Partner**: If the user asks about a public company or stock, you **must** use the \`getStockPrice\` tool to fetch its latest stock price.
- When using a tool, always state that you are using it and present the data clearly.
- After providing the data, always suggest a next step according to your experience level (version).`;

const executeInstructionFlow = ai.defineFlow(
  {
    name: 'executeInstructionFlow',
    inputSchema: ExecuteInstructionInputSchema,
    outputSchema: ExecuteInstructionOutputSchema,
  },
  async (input) => {
    let retries = 3;
    let delay = 1000; // start with 1 second

    // Determine which system prompt to use
    const systemPrompt = defaultSystemPrompt;

     const prompt = ai.definePrompt({
        name: 'executeInstructionPrompt',
        input: {schema: ExecuteInstructionInputSchema},
        output: {schema: ExecuteInstructionOutputSchema},
        tools: [getStockPrice], 
        system: systemPrompt,
        prompt: \`Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

Based on the full conversation history, provide your response as the assistant.\`,
      });
    
    while (retries > 0) {
      try {
        // Pass the partner-specific config to the prompt, so it's available to tools.
        const { output } = await prompt(input, { "tool_request": { "context": { "config": input.config } } });
        if (!output) {
          throw new Error('Failed to generate chat response: No output from model.');
        }
        return { response: output.response };
      } catch (e: any) {
        if (e.message?.includes('503 Service Unavailable') && retries > 1) {
          console.warn(\`Service unavailable, retrying in \${delay}ms... (\${retries - 1} retries left)\`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
          retries--;
        } else {
          throw e; // re-throw if not a 503 or no retries left
        }
      }
    }
    
    // This part should be unreachable if retries are exhausted, 
    // as the error will be re-thrown. But as a fallback:
    throw new Error('Failed to get chat response after multiple retries.');
  }
);
