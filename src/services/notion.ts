
'use server';
/**
 * @fileoverview Service for interacting with the Notion API.
 * - logPartnerCreation - Logs the details of a newly created AI partner to a Notion database.
 * - logFeedback - Logs user feedback to a Notion database.
 * - getPartnersFromNotion - Fetches the list of AI partners from a Notion database.
 */

import { Client } from "@notionhq/client";
import type { Partner } from "@/lib/partners";
import type { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";

interface PartnerData {
    name: string;
    skill: string;
    description: string;
    capability: string;
}

// Initialize the Notion client
const getNotionClient = () => {
    const notionApiKey = process.env.NOTION_API_KEY;
    if (!notionApiKey) {
        console.warn("NOTION_API_KEY is not set. Skipping Notion integration.");
        return null;
    }
    return new Client({ auth: notionApiKey });
};

/**
 * Maps a Notion page object to a Partner object.
 */
function mapNotionPageToPartner(page: any): Partner | null {
  try {
    const properties = page.properties;
    
    // Helper to safely extract rich text content
    const getText = (prop: any) => prop?.rich_text?.[0]?.plain_text ?? '';
    const getTitle = (prop: any) => prop?.title?.[0]?.plain_text ?? '';
    const getNumber = (prop: any) => prop?.number ?? 1.0;
    const getSelect = (prop: any) => prop?.select?.name ?? 'Basic';
    const getMultiSelect = (prop: any) => prop?.multi_select?.map((s: any) => s.name) ?? ['text'];

    const name = getTitle(properties.Name);
    if (!name) return null; // A partner must have a name

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    return {
      slug: getText(properties.Slug) || slug,
      name: name,
      skill: getText(properties.Skill),
      description: getText(properties.Description),
      icon: (getText(properties.Icon) as keyof import('lucide-react')) || 'Bot',
      price: getNumber(properties.Price),
      tier: getSelect(properties.Tier),
      version: getNumber(properties.Version),
      capabilities: getMultiSelect(properties.Capabilities),
      config: {}, // Config is managed locally for now
    };
  } catch (error) {
    console.error(`Failed to map Notion page ${page.id} to partner:`, error);
    return null;
  }
}

/**
 * Fetches the list of AI partners from a Notion database.
 * @returns {Promise<Partner[]>} A promise that resolves to an array of partners.
 */
export async function getPartnersFromNotion(): Promise<Partner[]> {
    const notion = getNotionClient();
    const databaseId = process.env.NOTION_PARTNERS_DATABASE_ID;

    if (!notion || !databaseId || databaseId.startsWith("GANTI_DENGAN")) {
        console.warn("Notion client or partners database ID is not configured. Returning empty list.");
        return [];
    }

    try {
        console.log(`Fetching partners from Notion database: ${databaseId}`);
        const response: QueryDatabaseResponse = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'Status',
                select: {
                    equals: 'Published',
                },
            },
            sorts: [
                {
                    property: 'Order',
                    direction: 'ascending',
                },
            ],
        });
        
        const partners = response.results
            .map(page => mapNotionPageToPartner(page))
            .filter((p): p is Partner => p !== null);
            
        console.log(`Successfully fetched ${partners.length} partners from Notion.`);
        return partners;

    } catch (error) {
        console.error("Failed to fetch partners from Notion:", error);
        return []; // Return empty array on error to prevent app crash
    }
}


/**
 * Logs the creation of a new AI partner to a specified Notion database.
 * @param {PartnerData} partner - The partner data to log.
 */
export async function logPartnerCreation(partner: PartnerData) {
    const notion = getNotionClient();
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!notion || !databaseId || databaseId.startsWith("GANTI_DENGAN")) {
        console.log("Notion client or partner database ID is not configured. Skipping log.");
        return;
    }
    
    console.log(`Logging partner "${partner.name}" to Notion database: ${databaseId}`);

    try {
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                'Name': {
                    title: [{ text: { content: partner.name } }],
                },
                'Skill': {
                    rich_text: [{ text: { content: partner.skill } }],
                },
                'Description': {
                    rich_text: [{ text: { content: partner.description } }],
                },
                'Capability': {
                    rich_text: [{ text: { content: partner.capability } }],
                },
                'Status': {
                    select: { name: 'New Request' }
                }
            },
        });
        console.log("Successfully logged partner creation to Notion.");
    } catch (error) {
        console.error("Failed to log partner creation to Notion:", error);
    }
}


/**
 * Logs user feedback to a specified Notion database.
 * @param {string} feedback - The user's feedback text.
 */
export async function logFeedback(feedback: string) {
    const notion = getNotionClient();
    const databaseId = process.env.NOTION_FEEDBACK_DATABASE_ID;

    if (!notion || !databaseId || databaseId.startsWith("GANTI_DENGAN")) {
        console.log("Notion client or feedback database ID is not configured. Skipping log.");
        return;
    }

    console.log(`Logging feedback to Notion database: ${databaseId}`);

    try {
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                // Assumes the "Title" or "Name" column in your feedback DB is named 'Feedback'
                'Feedback': {
                    title: [{ text: { content: feedback.substring(0, 100) } }],
                },
                 // Assumes you have a rich text column named 'Full Feedback'
                'Full Feedback': {
                     rich_text: [{ text: { content: feedback } }],
                },
                'Status': {
                    select: { name: 'New' }
                }
            },
        });
        console.log("Successfully logged feedback to Notion.");
    } catch (error) {
        console.error("Failed to log feedback to Notion:", error);
    }
}
