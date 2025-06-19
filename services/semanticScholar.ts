
import { Paper } from '../types';
import { SEMANTIC_SCHOLAR_API_URL, PAPERS_PER_PAGE } from '../constants';

export interface SemanticScholarSearchResponse {
  papers: Paper[];
  total: number;
  offset: number;
}

export async function searchSemanticScholarPapers(
  topic: string, 
  apiKey: string, 
  limit: number = PAPERS_PER_PAGE,
  offset: number = 0
): Promise<SemanticScholarSearchResponse> {
  if (!apiKey) {
    throw new Error("Semantic Scholar API key is required and not provided.");
  }

  const queryParams = new URLSearchParams({
    query: topic,
    fields: 'paperId,title,authors.name,year,abstract,url,venue,citationCount',
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${SEMANTIC_SCHOLAR_API_URL}?${queryParams.toString()}`, {
    headers: {
      'x-api-key': apiKey,
    },
  });

  if (!response.ok) {
    let errorMessage = `Semantic Scholar API error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = `Semantic Scholar API error: ${errorData.message}`;
      } else if (errorData && errorData.error) {
        errorMessage = `Semantic Scholar API error: ${errorData.error}`;
      }
    } catch (e) {
      // Ignore if response is not JSON
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  const papers: Paper[] = (data.data || []).map((item: any): Paper => ({
    paperId: item.paperId,
    title: item.title || 'N/A',
    authors: item.authors || [],
    year: item.year || null,
    abstract: item.abstract || null,
    url: item.url || null,
    venue: item.venue || null,
    citationCount: item.citationCount === undefined ? null : item.citationCount,
  }));

  return {
    papers: papers,
    total: data.total || 0,
    offset: data.offset || 0,
  };
}

export async function fetchAllPapersForTopic(
  topic: string,
  apiKey: string,
  practicalLimit: number
): Promise<Paper[]> {
  if (!apiKey) throw new Error("Semantic Scholar API key is required for fetching all papers.");

  const allPapersList: Paper[] = [];
  const fetchedIds = new Set<string>();
  let currentOffset = 0;
  const s2ApiPageLimit = 100; // Semantic Scholar API allows up to 100 results per page
  let totalReportedByApi = 0;
  let keepFetching = true;

  // Initial call to get the total number of papers
  try {
    const initialResponse = await searchSemanticScholarPapers(topic, apiKey, 1, 0);
    totalReportedByApi = initialResponse.total;
    if (totalReportedByApi === 0) return [];
  } catch (e) {
    console.error("Error fetching initial paper count for 'select all':", e);
    throw e; 
  }
  
  const limitForThisOperation = Math.min(totalReportedByApi, practicalLimit);
  if (totalReportedByApi > practicalLimit) {
      console.warn(`Attempting to fetch ${limitForThisOperation} papers out of ${totalReportedByApi} total reported by Semantic Scholar. Capping at ${practicalLimit} for this operation.`);
  }

  while (currentOffset < limitForThisOperation && keepFetching && allPapersList.length < limitForThisOperation) {
    try {
      // Determine how many to fetch in this iteration to not exceed limitForThisOperation
      const numToFetchThisCall = Math.min(s2ApiPageLimit, limitForThisOperation - allPapersList.length);
      if (numToFetchThisCall <= 0) break; // Should not happen if loop condition is right

      const response = await searchSemanticScholarPapers(topic, apiKey, numToFetchThisCall, currentOffset);
      
      if (response.papers.length === 0) {
        keepFetching = false; // No more papers returned from API
        break;
      }

      response.papers.forEach(p => {
        if (!fetchedIds.has(p.paperId)) {
          allPapersList.push(p);
          fetchedIds.add(p.paperId);
        }
      });
      
      currentOffset += response.papers.length; // S2's offset field refers to the requested offset. We advance by actual papers received.

      if (allPapersList.length >= limitForThisOperation) {
        keepFetching = false;
      }

    } catch (error) {
      console.error(`Error fetching page of papers during 'select all' (offset ${currentOffset}):`, error);
      keepFetching = false; // Stop on error to avoid hammering API or partial bad state
      throw error; // Propagate error to be handled by caller UI
    }
  }
  // Ensure we only return up to the limit, in case the last fetch went slightly over due to API behavior (unlikely with S2)
  return allPapersList.slice(0, limitForThisOperation); 
}
